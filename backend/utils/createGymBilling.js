import PlatformPricing from "../models/PlatformPricing.js";
import GymBilling from "../models/GymBilling.js";

export const calculateGymProCharge = (durationMonths, pricePerMemberMonth) =>
  Math.round(durationMonths * pricePerMemberMonth * 100) / 100;

export const createGymBilling = async (record, tenantId, session) => {
  if (!["recharge", "admin_recharge"].includes(record.source)) return null;

  const pricing = await PlatformPricing.findOneAndUpdate(
    { _id: "global" },
    { $setOnInsert: { pricePerMemberMonth: 50 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );
  const pricePerMemberMonth = pricing.pricePerMemberMonth;
  const [billing] = await GymBilling.create(
    [
      {
        tenantId,
        memberId: record.memberId,
        membershipRecordId: record._id,
        planName: record.planName,
        durationMonths: record.durationMonths,
        purchasedAt: record.rechargedAt,
        pricePerMemberMonth,
        amount: calculateGymProCharge(
          record.durationMonths,
          pricePerMemberMonth
        ),
      },
    ],
    { session }
  );
  return billing;
};
