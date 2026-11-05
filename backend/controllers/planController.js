import Plan from "../models/Plan.js";

const defaultPlans = [
  { name: "Monthly", price: 1000, duration: 1 },
  { name: "3 Months", price: 2700, duration: 3 },
  { name: "6 Months", price: 5000, duration: 6 },
  { name: "Yearly", price: 9000, duration: 12 },
];

export const getPlans = async (req, res) => {
  try {
    await Promise.all(
      defaultPlans.map((plan) =>
        Plan.updateOne(
          { name: plan.name },
          { $setOnInsert: plan },
          { upsert: true }
        )
      )
    );

    const plans = await Plan.find({ active: true })
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
