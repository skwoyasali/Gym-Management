import mongoose from "mongoose";
import Plan from "../models/Plan.js";
import Member from "../models/Member.js";

export const getPlans = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.id;
    const plans = await Plan.find({ active: true, createdBy: tenantId })
      .sort({ duration: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch membership plans",
    });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { name, price, duration } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const parsedPrice = Number(price);
    const parsedDuration = Number(duration);

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 80 ||
      price === "" ||
      price === null ||
      price === undefined ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      duration === "" ||
      duration === null ||
      duration === undefined ||
      !Number.isInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 120
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a plan name (2–80 characters), a valid price, and a duration between 1 and 120 months",
      });
    }

    const tenantId = req.user.tenantId || req.user.id;
    const plan = await Plan.create({
      name: normalizedName,
      price: parsedPrice,
      duration: parsedDuration,
      createdBy: tenantId,
    });

    return res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      data: plan,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A plan with this name already exists in your gym",
      });
    }

    console.error("Create plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create membership plan",
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership plan ID",
      });
    }

    const { name, price, duration } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const parsedPrice = Number(price);
    const parsedDuration = Number(duration);

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 80 ||
      price === "" ||
      price === null ||
      price === undefined ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      duration === "" ||
      duration === null ||
      duration === undefined ||
      !Number.isInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 120
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a plan name (2–80 characters), a valid price, and a duration between 1 and 120 months",
      });
    }

    const tenantId = req.user.tenantId || req.user.id;
    const plan = await Plan.findOneAndUpdate(
      { _id: req.params.id, createdBy: tenantId },
      {
        $set: {
          name: normalizedName,
          price: parsedPrice,
          duration: parsedDuration,
        },
      },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Custom membership plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership plan updated successfully",
      data: plan,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A plan with this name already exists in your gym",
      });
    }

    console.error("Update plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update membership plan",
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership plan ID",
      });
    }

    const tenantId = req.user.tenantId || req.user.id;
    const plan = await Plan.findOne({
      _id: req.params.id,
      createdBy: tenantId,
    }).lean();

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Custom membership plan not found",
      });
    }

    const assignedMembers = await Member.countDocuments({ plan: plan._id });
    if (assignedMembers > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This plan is assigned to members and cannot be deleted. Edit it instead.",
      });
    }

    await Plan.deleteOne({ _id: plan._id, createdBy: tenantId });

    return res.status(200).json({
      success: true,
      message: "Membership plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete membership plan",
    });
  }
};
