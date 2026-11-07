import Plan from "../models/Plan.js";

const defaultPlans = [
  { name: "Monthly", price: 1000, duration: 1 },
  { name: "3 Months", price: 2700, duration: 3 },
  { name: "6 Months", price: 5000, duration: 6 },
  { name: "Yearly", price: 9000, duration: 12 },
];

export const getPlans = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.id;

    await Promise.all(
      defaultPlans.map((plan) =>
        Plan.updateOne(
          { name: plan.name, createdBy: null },
          { $setOnInsert: plan },
          { upsert: true }
        )
      )
    );

    const plans = await Plan.find({
      active: true,
      $or: [{ createdBy: tenantId }, { createdBy: null }],
    })
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
