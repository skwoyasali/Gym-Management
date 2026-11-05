import mongoose from "mongoose";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";

// GET ALL MEMBERS
export const getMembers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;
    const tenantId = req.user.tenantId || req.user.id;
    const tenantFilter = { createdBy: tenantId };

    const [members, total] = await Promise.all([
      Member.find(tenantFilter)
        .populate("plan", "name price duration")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Member.countDocuments(tenantFilter),
    ]);

    return res.status(200).json({
      success: true,
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get members error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch members",
    });
  }
};


// ADD MEMBER
export const addMember = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      address,
      plan,
      membershipStart,
      membershipEnd,
    } = req.body;
    const tenantId = req.user.tenantId || req.user.id;

    // Validate required fields
    if (
      !name ||
      !phone ||
      !plan ||
      !membershipStart ||
      !membershipEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, phone, plan, membership start and membership end are required",
      });
    }
    

    // Validate ObjectId
    if (!mongoose.isValidObjectId(plan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }
    

    // Validate dates
    const startDate = new Date(membershipStart);
    const endDate = new Date(membershipEnd);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership dates",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Membership end date must be after start date",
      });
    }

    // Check duplicate phone
    const existingMember = await Member.findOne({
      phone: phone.trim(),
      createdBy: tenantId,
    }).lean();

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: "A member with this phone number already exists",
      });
    }
   

    // Create member
    const member = await Member.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim().toLowerCase(),
      gender,
      dateOfBirth: dateOfBirth || undefined,
      address: address?.trim(),
      plan,
      membershipStart: startDate,
      membershipEnd: endDate,

      // IMPORTANT:
      // Take user ID from authenticated JWT,
      // not from req.body.
      createdBy: tenantId,
    });

    const populatedMember = await member.populate(
      "plan",
      "name price duration"
    );

    return res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: populatedMember,
    });
  } catch (error) {
    console.error("Add member error:", error);

    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A member with this information already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create member",
    });
  }
};

// UPDATE MEMBER
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      address,
      plan,
      membershipStart,
      membershipEnd,
      active,
    } = req.body;
    const tenantId = req.user.tenantId || req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    if (
      typeof name !== "string" ||
      typeof phone !== "string" ||
      !name.trim() ||
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      !/^[0-9]{10}$/.test(phone.trim()) ||
      !plan ||
      !membershipStart ||
      !membershipEnd
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid member details and membership dates",
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (!mongoose.isValidObjectId(plan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    const startDate = new Date(membershipStart);
    const endDate = new Date(membershipEnd);
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Membership end date must be after the start date",
      });
    }

    const member = await Member.findOne({
      _id: id,
      createdBy: tenantId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const [existingPhone, existingPlan] = await Promise.all([
      Member.findOne({
        _id: { $ne: id },
        createdBy: tenantId,
        phone: phone.trim(),
      }).lean(),
      Plan.exists({ _id: plan }),
    ]);

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "A member with this phone number already exists",
      });
    }

    if (!existingPlan) {
      return res.status(400).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    member.name = name.trim();
    member.phone = phone.trim();
    member.email = email?.trim().toLowerCase() || undefined;
    member.gender = gender || undefined;
    member.dateOfBirth = dateOfBirth || undefined;
    member.address = address?.trim() || undefined;
    member.plan = plan;
    member.membershipStart = startDate;
    member.membershipEnd = endDate;
    if (typeof active === "boolean") member.active = active;

    await member.save();
    await member.populate("plan", "name price duration");

    return res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    console.error("Update member error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A member with this information already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update member",
    });
  }
};


// DELETE MEMBER
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || req.user.id;

    // Validate MongoDB ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    const member = await Member.findOneAndDelete({
      _id: id,
      createdBy: tenantId,
    });

    // Member doesn't exist
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("Delete member error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete member",
    });
  }
};