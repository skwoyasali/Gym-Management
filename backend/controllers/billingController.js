import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import GymBilling from "../models/GymBilling.js";
import GymProPayment from "../models/GymProPayment.js";
import PlatformPricing from "../models/PlatformPricing.js";
import Member from "../models/Member.js";
import MembershipRecord from "../models/MembershipRecord.js";
import User from "../models/User.js";
import {
  mongoTransactionsUnavailableMessage,
  supportsMongoTransactions,
} from "../utils/mongoTransactions.js";

const getTenantId = (user) => user.tenantId || user.id;
const roundCurrency = (value) => Math.round(value * 100) / 100;
const isGymActive = (gym, now = new Date()) =>
  gym.accountStatus !== "inactive" && (!gym.expiresAt || gym.expiresAt > now);
const parseExpiryDate = (value) => {
  if (typeof value !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const startOfDay = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(startOfDay.getTime()) ||
      startOfDay.toISOString().slice(0, 10) !== value
    ) return null;
    return new Date(`${value}T23:59:59.999Z`);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getGymBilling = async (req, res) => {
  try {
    const tenantId = getTenantId(req.user);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const [gym, pricing, bills, billCount, totals] = await Promise.all([
      Gym.findOne({ ownerId: tenantId }).select("gymName").lean(),
      PlatformPricing.findById("global").lean(),
      GymBilling.find({ tenantId })
        .populate("memberId", "name")
        .populate("paymentId", "amount paymentDate reference")
        .sort({ purchasedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      GymBilling.countDocuments({ tenantId }),
      GymBilling.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        {
          $group: {
            _id: "$status",
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const amounts = Object.fromEntries(
      totals.map((item) => [item._id, item.amount])
    );
    return res.status(200).json({
      success: true,
      data: {
        gymName: gym?.gymName || "",
        pricePerMemberMonth: pricing?.pricePerMemberMonth ?? 50,
        totalPayable: roundCurrency((amounts.pending || 0) + (amounts.paid || 0)),
        totalPaid: roundCurrency(amounts.paid || 0),
        outstandingBalance: roundCurrency(amounts.pending || 0),
        billableMemberships: totals.reduce((sum, item) => sum + item.count, 0),
        bills,
        pagination: {
          page,
          limit,
          total: billCount,
          totalPages: Math.ceil(billCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get gym billing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch GymPro billing",
    });
  }
};

const getSuperAdminGyms = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const search = String(req.query.search || "").trim().slice(0, 100);
  const status = String(req.query.status || "all");
  if (!["all", "active", "inactive"].includes(status)) {
    return { error: "Invalid gym status filter", statusCode: 400 };
  }

  const conditions = [];
  if (status === "active") {
    conditions.push({
      accountStatus: { $ne: "inactive" },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
  } else if (status === "inactive") {
    conditions.push({
      $or: [
        { accountStatus: "inactive" },
        { expiresAt: { $ne: null, $lte: new Date() } },
      ],
    });
  }
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const ownerIds = await User
      .find({
        $or: [
          { username: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
        ],
      })
      .distinct("_id");
    conditions.push({
      $or: [
        { gymName: { $regex: escaped, $options: "i" } },
        { ownerName: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
        { ownerId: { $in: ownerIds } },
      ],
    });
  }
  const filter = conditions.length ? { $and: conditions } : {};
  const [gyms, total] = await Promise.all([
    Gym.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Gym.countDocuments(filter),
  ]);
  return { gyms, page, limit, total };
};

const getGymMetrics = async (ownerIds) => {
  if (!ownerIds.length) return new Map();
  const [memberStats, revenueStats, billingStats] = await Promise.all([
    Member.aggregate([
      { $match: { createdBy: { $in: ownerIds } } },
      {
        $group: {
          _id: "$createdBy",
          totalMembers: { $sum: 1 },
          activeMembers: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$active", true] },
                    { $gte: ["$membershipEnd", new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    MembershipRecord.aggregate([
      {
        $match: {
          tenantId: { $in: ownerIds },
          paymentStatus: "verified",
          source: { $ne: "legacy" },
        },
      },
      { $group: { _id: "$tenantId", revenue: { $sum: "$amount" } } },
    ]),
    GymBilling.aggregate([
      { $match: { tenantId: { $in: ownerIds } } },
      { $group: { _id: "$tenantId", total: { $sum: "$amount" } } },
    ]),
  ]);
  const metrics = new Map();
  ownerIds.forEach((id) =>
    metrics.set(id.toString(), {
      totalMembers: 0,
      activeMembers: 0,
      membershipRevenue: 0,
      billingAmount: 0,
    })
  );
  memberStats.forEach((item) =>
    Object.assign(metrics.get(item._id.toString()), item)
  );
  revenueStats.forEach((item) => {
    metrics.get(item._id.toString()).membershipRevenue = item.revenue;
  });
  billingStats.forEach((item) => {
    metrics.get(item._id.toString()).billingAmount = item.total;
  });
  return metrics;
};

export const getSuperAdminDashboard = async (req, res) => {
  try {
    const [gyms, pricing, memberTotals, revenue, billing] = await Promise.all([
      Gym.find().select("accountStatus expiresAt").lean(),
      PlatformPricing.findById("global").lean(),
      Member.aggregate([
        {
          $match: {
            active: true,
            membershipEnd: { $gte: new Date() },
          },
        },
        { $count: "count" },
      ]),
      MembershipRecord.aggregate([
        {
          $match: {
            paymentStatus: "verified",
            source: { $ne: "legacy" },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      GymBilling.aggregate([
        { $group: { _id: "$status", total: { $sum: "$amount" } } },
      ]),
    ]);
    const now = new Date();
    const activeGyms = gyms.filter(
      (gym) =>
        isGymActive(gym, now)
    ).length;
    const billingAmounts = Object.fromEntries(
      billing.map((entry) => [entry._id, entry.total])
    );
    return res.status(200).json({
      success: true,
      data: {
        totalGyms: gyms.length,
        activeGyms,
        inactiveGyms: gyms.length - activeGyms,
        totalMembers: memberTotals[0]?.count || 0,
        totalMembershipRevenue: roundCurrency(revenue[0]?.total || 0),
        totalPlatformRevenue: roundCurrency(billingAmounts.paid || 0),
        totalPlatformPayable: roundCurrency(
          (billingAmounts.paid || 0) + (billingAmounts.pending || 0)
        ),
        outstandingBalance: roundCurrency(billingAmounts.pending || 0),
        pricePerMemberMonth: pricing?.pricePerMemberMonth ?? 50,
      },
    });
  } catch (error) {
    console.error("Get Super Admin dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Super Admin dashboard",
    });
  }
};

export const listSuperAdminGyms = async (req, res) => {
  try {
    const result = await getSuperAdminGyms(req);
    if (result.error) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error,
      });
    }
    const ownerIds = result.gyms.map((gym) => gym.ownerId);
    const [owners, metrics] = await Promise.all([
      User.find({ _id: { $in: ownerIds } })
        .select("username email")
        .lean(),
      getGymMetrics(ownerIds),
    ]);
    const ownersById = new Map(owners.map((owner) => [owner._id.toString(), owner]));
    return res.status(200).json({
      success: true,
      data: result.gyms.map((gym) => ({
        ...gym,
        accountStatus: isGymActive(gym) ? "active" : "inactive",
        admin: ownersById.get(gym.ownerId.toString()) || null,
        ...(metrics.get(gym.ownerId.toString()) || {
          totalMembers: 0,
          activeMembers: 0,
          membershipRevenue: 0,
          billingAmount: 0,
        }),
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error("List Super Admin gyms error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch gyms",
    });
  }
};

export const getSuperAdminGymDetails = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid gym ID" });
    }
    const gym = await Gym.findById(req.params.id).lean();
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found" });
    }
    const memberPage = Math.max(Number(req.query.memberPage) || 1, 1);
    const billingPage = Math.max(Number(req.query.billingPage) || 1, 1);
    const pageSize = 20;
    const [admin, metrics, members, memberCount, bills, billCount] = await Promise.all([
      User.findById(gym.ownerId).select("username email").lean(),
      getGymMetrics([gym.ownerId]),
      Member.find({ createdBy: gym.ownerId })
        .select("name phone active membershipStart membershipEnd createdAt plan")
        .populate("plan", "name duration")
        .sort({ createdAt: -1 })
        .skip((memberPage - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Member.countDocuments({ createdBy: gym.ownerId }),
      GymBilling.find({ tenantId: gym.ownerId })
        .populate("memberId", "name")
        .populate("paymentId", "amount paymentDate reference")
        .sort({ purchasedAt: -1 })
        .skip((billingPage - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      GymBilling.countDocuments({ tenantId: gym.ownerId }),
    ]);
    const stats = metrics.get(gym.ownerId.toString());
    return res.status(200).json({
      success: true,
      data: {
        ...gym,
        accountStatus: isGymActive(gym) ? "active" : "inactive",
        admin,
        ...stats,
        members,
        bills,
        memberPagination: {
          page: memberPage,
          limit: pageSize,
          total: memberCount,
          totalPages: Math.ceil(memberCount / pageSize),
        },
        billingPagination: {
          page: billingPage,
          limit: pageSize,
          total: billCount,
          totalPages: Math.ceil(billCount / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Get Super Admin gym details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch gym details",
    });
  }
};

export const updateSuperAdminGym = async (req, res) => {
  try {
    const { accountStatus, expiresAt } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid gym ID" });
    }
    if (
      !["active", "inactive", undefined].includes(accountStatus) ||
      (expiresAt !== undefined &&
        expiresAt !== null &&
        !parseExpiryDate(expiresAt)) ||
      (expiresAt === undefined && accountStatus === undefined)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid account status or expiration date",
      });
    }
    const updates = {};
    if (accountStatus !== undefined) updates.accountStatus = accountStatus;
    if (accountStatus === "active" && expiresAt === undefined) {
      const currentGym = await Gym.findById(req.params.id)
        .select("expiresAt")
        .lean();
      if (!currentGym) {
        return res.status(404).json({ success: false, message: "Gym not found" });
      }
      if (currentGym.expiresAt && currentGym.expiresAt <= new Date()) {
        updates.expiresAt = null;
      }
    }
    if (expiresAt !== undefined) {
      updates.expiresAt = expiresAt ? parseExpiryDate(expiresAt) : null;
      if (updates.expiresAt && updates.expiresAt <= new Date()) {
        updates.accountStatus = "inactive";
      }
    }
    const gym = await Gym.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Gym account updated",
      data: gym,
    });
  } catch (error) {
    console.error("Update Super Admin gym error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update gym account",
    });
  }
};

export const listSuperAdminBilling = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = {};
    if (req.query.gymId) {
      if (!mongoose.isValidObjectId(req.query.gymId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gym filter",
        });
      }
      filter.tenantId = new mongoose.Types.ObjectId(req.query.gymId);
    }
    if (req.query.status && req.query.status !== "all") {
      if (!["pending", "paid"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid billing status filter",
        });
      }
      filter.status = req.query.status;
    }
    if (req.query.from || req.query.to) {
      filter.purchasedAt = {};
      if (req.query.from) filter.purchasedAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const toDate = new Date(req.query.to);
        toDate.setUTCHours(23, 59, 59, 999);
        filter.purchasedAt.$lte = toDate;
      }
      if (
        Object.values(filter.purchasedAt).some((date) =>
          Number.isNaN(date.getTime())
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid billing date range",
        });
      }
      if (
        filter.purchasedAt.$gte &&
        filter.purchasedAt.$lte &&
        filter.purchasedAt.$gte > filter.purchasedAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Billing start date must be before the end date",
        });
      }
    }
    const [bills, total, totals, gyms, outstandingByGym] = await Promise.all([
      GymBilling.find(filter)
        .populate("memberId", "name")
        .populate("paymentId", "amount paymentDate reference")
        .sort({ purchasedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      GymBilling.countDocuments(filter),
      GymBilling.aggregate([
        { $match: filter },
        { $group: { _id: "$status", amount: { $sum: "$amount" } } },
      ]),
      Gym.find().select("ownerId gymName").lean(),
      GymBilling.aggregate([
        { $match: { status: "pending" } },
        {
          $group: {
            _id: "$tenantId",
            outstanding: { $sum: "$amount" },
          },
        },
        { $sort: { outstanding: -1 } },
      ]),
    ]);
    const ownerIds = [...new Set(bills.map((bill) => bill.tenantId.toString()))];
    const owners = await User.find({ _id: { $in: ownerIds } })
      .select("username email")
      .lean();
    const gymsByOwner = new Map(gyms.map((gym) => [gym.ownerId.toString(), gym]));
    const ownersById = new Map(owners.map((owner) => [owner._id.toString(), owner]));
    const amounts = Object.fromEntries(totals.map(({ _id, amount }) => [_id, amount]));
    const gymOutstanding = outstandingByGym.map((entry) => ({
      gymId: entry._id,
      gymName: gymsByOwner.get(entry._id.toString())?.gymName || "Gym",
      outstanding: roundCurrency(entry.outstanding),
    }));
    return res.status(200).json({
      success: true,
      data: bills.map((bill) => ({
        ...bill,
        gym: gymsByOwner.get(bill.tenantId.toString()) || null,
        admin: ownersById.get(bill.tenantId.toString()) || null,
      })),
      summary: {
        totalPayable: roundCurrency(
          (amounts.pending || 0) + (amounts.paid || 0)
        ),
        totalPaid: roundCurrency(amounts.paid || 0),
        outstanding: roundCurrency(amounts.pending || 0),
      },
      gymOutstanding,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List Super Admin billing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch platform billing",
    });
  }
};

export const recordGymPayment = async (req, res) => {
  const { paymentDate, reference } = req.body;
  if (
    !mongoose.isValidObjectId(req.params.id) ||
    (paymentDate !== undefined &&
      (typeof paymentDate !== "string" ||
        Number.isNaN(new Date(paymentDate).getTime()))) ||
    (reference !== undefined &&
      (typeof reference !== "string" || reference.trim().length > 120))
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid payment date and reference",
    });
  }
  let session;
  try {
    const helloResponse = await mongoose.connection.db
      .admin()
      .command({ hello: 1 });
    if (!supportsMongoTransactions(helloResponse)) {
      return res.status(503).json({
        success: false,
        message: mongoTransactionsUnavailableMessage,
      });
    }
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      const billing = await GymBilling.findOneAndUpdate(
        { _id: req.params.id, status: "pending" },
        { $set: { status: "paid", paidAt: new Date() } },
        { new: true, session }
      );
      if (!billing) {
        const error = new Error("Bill not found or already paid");
        error.status = 409;
        throw error;
      }
      const [payment] = await GymProPayment.create(
        [
          {
            tenantId: billing.tenantId,
            billingId: billing._id,
            amount: billing.amount,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            reference: reference?.trim() || undefined,
            recordedBy: req.user.id,
          },
        ],
        { session }
      );
      billing.paymentId = payment._id;
      await billing.save({ session });
      result = { billing, payment };
    });
    return res.status(201).json({
      success: true,
      message: "Payment recorded and bill marked paid",
      data: result,
    });
  } catch (error) {
    if (error.status || error.code === 11000) {
      return res.status(error.status || 409).json({
        success: false,
        message: error.message || "This bill has already been paid",
      });
    }
    console.error("Record GymPro payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  } finally {
    await session?.endSession();
  }
};

export const getPlatformPricing = async (req, res) => {
  try {
    const pricing = await PlatformPricing.findOneAndUpdate(
      { _id: "global" },
      { $setOnInsert: { pricePerMemberMonth: 50 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    return res.status(200).json({ success: true, data: pricing });
  } catch (error) {
    console.error("Get platform pricing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch platform pricing",
    });
  }
};

export const updatePlatformPricing = async (req, res) => {
  const price = req.body.pricePerMemberMonth;
  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 100000 ||
    Math.round(price * 100) / 100 !== price
  ) {
    return res.status(400).json({
      success: false,
      message: "Price must be a valid amount between ₹0 and ₹100,000",
    });
  }
  try {
    const pricing = await PlatformPricing.findOneAndUpdate(
      { _id: "global" },
      {
        $set: {
          pricePerMemberMonth: price,
          updatedBy: req.user.id,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    return res.status(200).json({
      success: true,
      message: "Platform pricing updated",
      data: pricing,
    });
  } catch (error) {
    console.error("Update platform pricing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update platform pricing",
    });
  }
};
