import mongoose from "mongoose";
import crypto from "crypto";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import {
  deletePrivateImage,
  getPrivateImagePath,
  savePrivateImage,
} from "../utils/privateImageStorage.js";
import {
  getMemberPhotoFilter,
  serializeMemberPhoto,
} from "../utils/memberPhoto.js";

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
    const search = String(req.query.search || "").trim().slice(0, 100);
    const status = req.query.status;
    const planId = String(req.query.plan || "").trim();
    const tenantFilter = { createdBy: tenantId };
    if (status === "active") tenantFilter.active = true;
    if (status === "inactive") tenantFilter.active = false;
    if (planId) {
      if (!mongoose.isValidObjectId(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid membership plan",
        });
      }
      tenantFilter.plan = planId;
    }

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const memberFilter = search
      ? {
          $and: [
            tenantFilter,
            {
              $or: [
                { name: { $regex: escapedSearch, $options: "i" } },
                { phone: { $regex: escapedSearch } },
              ],
            },
          ],
        }
      : tenantFilter;

    const [members, total] = await Promise.all([
      Member.find(memberFilter)
        .select("+photoStorageKey")
        .populate("plan", "name price duration")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Member.countDocuments(memberFilter),
    ]);

    return res.status(200).json({
      success: true,
      data: members.map(serializeMemberPhoto),
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
  let savedPhoto;
  try {
    const {
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      address,
    } = req.body;
    const tenantId = req.user.tenantId || req.user.id;

    if (
      typeof name !== "string" ||
      typeof phone !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      !/^[0-9]{10}$/.test(phone.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid member name and 10-digit phone number",
      });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
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
    if (req.file) {
      savedPhoto = await savePrivateImage(req.file.buffer, req.file.mimetype);
    }

    const member = await Member.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim().toLowerCase(),
      gender,
      dateOfBirth: dateOfBirth || undefined,
      address: address?.trim(),
      photoStorageKey: savedPhoto?.storageKey,
      active: false,

      // IMPORTANT:
      // Take user ID from authenticated JWT,
      // not from req.body.
      createdBy: tenantId,
    });
    savedPhoto = null;

    const populatedMember = await member.populate(
      "plan",
      "name price duration"
    );

    return res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: serializeMemberPhoto(populatedMember),
    });
  } catch (error) {
    if (savedPhoto) {
      await deletePrivateImage(savedPhoto.storageKey).catch((cleanupError) =>
        console.error("Remove unlinked member photo error:", cleanupError)
      );
    }
    console.error("Add member error:", error);

    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A member with this information already exists",
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Failed to create member",
    });
  }
};

// UPDATE MEMBER
export const updateMember = async (req, res) => {
  let savedPhoto;
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      address,
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
      !/^[0-9]{10}$/.test(phone.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid member personal details",
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    const member = await Member.findOne({
      _id: id,
      createdBy: tenantId,
    }).select("+photoStorageKey");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const existingPhone = await Member.findOne({
        _id: { $ne: id },
        createdBy: tenantId,
        phone: phone.trim(),
      }).lean();

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "A member with this phone number already exists",
      });
    }

    const normalizedEmail = email?.trim().toLowerCase() || "";
    let linkedUser;
    if (member.userId) {
      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Members with login accounts must keep an email address",
        });
      }

      linkedUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: member.userId },
      }).lean();
      if (linkedUser) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }
    }

    member.name = name.trim();
    member.phone = phone.trim();
    member.email = normalizedEmail || undefined;
    member.gender = gender || undefined;
    member.dateOfBirth = dateOfBirth || undefined;
    member.address = address?.trim() || undefined;

    const previousPhotoStorageKey = member.photoStorageKey;
    if (req.file) {
      savedPhoto = await savePrivateImage(req.file.buffer, req.file.mimetype);
      member.photoStorageKey = savedPhoto.storageKey;
    }

    if (member.userId) {
      await User.updateOne(
        { _id: member.userId, tenantId },
        { $set: { email: normalizedEmail, username: name.trim() } }
      );
    }

    await member.save();
    savedPhoto = null;
    if (req.file && previousPhotoStorageKey) {
      await deletePrivateImage(previousPhotoStorageKey).catch((cleanupError) =>
        console.error("Remove replaced member photo error:", cleanupError)
      );
    }
    await member.populate("plan", "name price duration");

    return res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: serializeMemberPhoto(member),
    });
  } catch (error) {
    if (savedPhoto) {
      await deletePrivateImage(savedPhoto.storageKey).catch((cleanupError) =>
        console.error("Remove unlinked member photo error:", cleanupError)
      );
    }
    console.error("Update member error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A member with this information already exists",
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Failed to update member",
    });
  }
};

export const getMemberPhoto = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    const memberFilter = getMemberPhotoFilter(req.user, req.params.id);
    if (!memberFilter) {
      return res.status(404).json({
        success: false,
        message: "Member photo not found",
      });
    }

    const member = await Member.findOne(memberFilter)
      .select("+photoStorageKey")
      .lean();
    const imagePath = getPrivateImagePath(member?.photoStorageKey);
    if (!imagePath) {
      return res.status(404).json({
        success: false,
        message: "Member photo not found",
      });
    }

    return res.sendFile(imagePath, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Get member photo error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve member photo",
    });
  }
};

export const createMemberActivationCode = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
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

    if (!member.email) {
      return res.status(400).json({
        success: false,
        message: "Add an email address to this member before inviting them",
      });
    }

    if (member.userId) {
      return res.status(409).json({
        success: false,
        message: "This member already has a login account",
      });
    }

    const activationCode = crypto.randomBytes(24).toString("base64url");
    const activationCodeHash = crypto
      .createHash("sha256")
      .update(activationCode)
      .digest("hex");

    member.activationCodeHash = activationCodeHash;
    member.activationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await member.save();

    return res.status(201).json({
      success: true,
      message: "Member activation code created",
      data: {
        email: member.email,
        activationCode,
        expiresAt: member.activationCodeExpiresAt,
      },
    });
  } catch (error) {
    console.error("Create member activation code error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create member activation code",
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
    }).select("+photoStorageKey");

    // Member doesn't exist
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (member.userId) {
      await User.deleteOne({ _id: member.userId, tenantId });
    }
    await Attendance.deleteMany({ memberId: member._id, tenantId });
    if (member.photoStorageKey) {
      await deletePrivateImage(member.photoStorageKey).catch((cleanupError) =>
        console.error("Remove deleted member photo error:", cleanupError)
      );
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