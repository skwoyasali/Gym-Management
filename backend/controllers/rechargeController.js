import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import Member from "../models/Member.js";
import MembershipRecord from "../models/MembershipRecord.js";
import Plan from "../models/Plan.js";
import RechargeRequest from "../models/RechargeRequest.js";
import {
  DEFAULT_GYM_TIMEZONE,
  getDateKeyInTimeZone,
} from "../utils/gymDate.js";
import {
  calculateRechargeDates,
  dateKeyToUtcDate,
  getPlanDurationDays,
  isValidMembershipDateRange,
  selectLatestMembershipRecord,
} from "../utils/membershipDates.js";
import {
  deletePrivateImage,
  getPrivateImagePath,
  savePrivateImage,
} from "../utils/privateImageStorage.js";
import {
  getOwnMemberFilter,
  getRechargeRequestFilter,
  getRechargeTenantId,
  getTenantRechargeRequestFilter,
} from "../utils/rechargeAccess.js";
import {
  mongoTransactionsUnavailableMessage,
  supportsMongoTransactions,
} from "../utils/mongoTransactions.js";
import { serializeMemberPhoto } from "../utils/memberPhoto.js";
import { createGymBilling } from "../utils/createGymBilling.js";

const getTodayForGym = (gym) =>
  getDateKeyInTimeZone(
    new Date(),
    gym?.timezone || DEFAULT_GYM_TIMEZONE
  );
const proofUrl = (requestId) => `/recharges/requests/${requestId}/proof`;

const serializeRequest = (request) => {
  const result = request.toObject ? request.toObject() : { ...request };
  if (result.memberId?.name) {
    result.memberId = serializeMemberPhoto(result.memberId);
  }
  delete result.proofStorageKey;
  delete result.tenantId;
  delete result.reviewedBy;
  delete result.membershipRecordId;
  result.proofUrl = proofUrl(result._id);
  return result;
};

const serializeMembershipRecord = (record) => ({
  _id: record._id,
  planName: record.planName,
  durationMonths: record.durationMonths,
  amount: record.amount,
  membershipStart: record.membershipStart,
  membershipEnd: record.membershipEnd,
  rechargedAt: record.rechargedAt,
  paymentStatus: record.paymentStatus,
  paymentMethod: record.paymentMethod,
  approvalStatus: record.approvalStatus,
  source: record.source,
  transactionReference: record.transactionReference,
});

const serializePaymentSettings = (gym) => ({
  upiId: gym?.upiPayment?.upiId || "",
  receiverName: gym?.upiPayment?.receiverName || "",
  paymentNumber: gym?.upiPayment?.paymentNumber || "",
  instructions: gym?.upiPayment?.instructions || "",
  qrUrl: gym?.upiPayment?.qrStorageKey ? "/gym/payment-qr" : null,
});

export const getMemberRechargeOverview = async (req, res) => {
  try {
    const tenantId = getRechargeTenantId(req.user);
    const member = await Member.findOne(getOwnMemberFilter(req.user)).lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }

    const [gym, plans, requests, history] = await Promise.all([
      Gym.findOne({ ownerId: tenantId })
        .select("+upiPayment.qrStorageKey")
        .lean(),
      Plan.find({ createdBy: tenantId, active: true })
        .select("name price duration")
        .sort({ duration: 1 })
        .lean(),
      RechargeRequest.find({ tenantId, memberId: member._id })
        .sort({ createdAt: -1 })
        .limit(50),
      MembershipRecord.find({ tenantId, memberId: member._id })
        .sort({ membershipStart: -1, createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        plans,
        requests: requests.map(serializeRequest),
        history: history.map(serializeMembershipRecord),
        paymentSettings: serializePaymentSettings(gym),
      },
    });
  } catch (error) {
    console.error("Get member recharge overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge information",
    });
  }
};

export const submitRechargeRequest = async (req, res) => {
  let savedProof;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Upload a payment screenshot to submit a recharge request",
      });
    }

    const tenantId = getRechargeTenantId(req.user);
    const planId = String(req.body.planId || "");
    const transactionReference =
      typeof req.body.transactionReference === "string"
        ? req.body.transactionReference.trim()
        : "";

    if (
      !mongoose.isValidObjectId(planId) ||
      transactionReference.length > 120
    ) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid plan and enter a reference ID under 120 characters",
      });
    }

    const [member, plan, gym] = await Promise.all([
      Member.findOne(getOwnMemberFilter(req.user)).select("_id"),
      Plan.findOne({
        _id: planId,
        createdBy: tenantId,
        active: true,
      }),
      Gym.findOne({ ownerId: tenantId }).select("+upiPayment.qrStorageKey"),
    ]);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Selected membership plan is unavailable",
      });
    }
    if (
      !gym ||
      (!gym.upiPayment?.upiId &&
        !gym.upiPayment?.paymentNumber &&
        !gym.upiPayment?.qrStorageKey)
    ) {
      return res.status(409).json({
        success: false,
        message: "This gym has not configured UPI payment details yet",
      });
    }

    savedProof = await savePrivateImage(req.file.buffer, req.file.mimetype);

    const request = await RechargeRequest.create({
      tenantId,
      memberId: member._id,
      planId: plan._id,
      planName: plan.name,
      durationMonths: plan.duration,
      amount: plan.price,
      proofStorageKey: savedProof.storageKey,
      transactionReference,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Recharge request submitted. Your membership will change only after gym admin approval.",
      data: serializeRequest(request),
    });
  } catch (error) {
    if (savedProof) {
      await deletePrivateImage(savedProof.storageKey).catch((cleanupError) =>
        console.error("Remove unreferenced payment proof error:", cleanupError)
      );
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending request for this plan",
      });
    }
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Submit recharge request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit recharge request",
    });
  }
};

export const getRechargeRequests = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    if (!["pending", "approved", "rejected", "all"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recharge request status",
      });
    }
    const filter = getTenantRechargeRequestFilter(req.user);
    if (status !== "all") filter.status = status;

    const requests = await RechargeRequest.find(filter)
      .populate("memberId", "name phone email +photoStorageKey")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      data: requests.map(serializeRequest),
    });
  } catch (error) {
    console.error("Get recharge requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge requests",
    });
  }
};

export const reviewRechargeRequest = async (req, res) => {
  const { action } = req.params;
  if (!["approve", "reject"].includes(action)) {
    return res.status(404).json({
      success: false,
      message: "Recharge action not found",
    });
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid recharge request ID",
    });
  }

  const tenantId = getRechargeTenantId(req.user);
  if (action === "reject") {
    const reason =
      typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    if (reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason must be 500 characters or fewer",
      });
    }

    try {
      const request = await RechargeRequest.findOneAndUpdate(
        { _id: req.params.id, tenantId, status: "pending" },
        {
          $set: {
            status: "rejected",
            rejectionReason: reason,
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
          },
        },
        { new: true }
      );
      if (!request) {
        return res.status(409).json({
          success: false,
          message: "Request is unavailable or has already been reviewed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Recharge request rejected",
        data: serializeRequest(request),
      });
    } catch (error) {
      console.error("Reject recharge request error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to reject recharge request",
      });
    }
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
    let approvedRequest;
    await session.withTransaction(async () => {
      const request = await RechargeRequest.findOneAndUpdate(
        { _id: req.params.id, tenantId, status: "pending" },
        {
          $set: {
            status: "approved",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
          },
        },
        { new: true, session }
      );

      if (!request) {
        const error = new Error(
          "Request is unavailable or has already been reviewed"
        );
        error.status = 409;
        throw error;
      }

      const member = await Member.findOne({
        _id: request.memberId,
        createdBy: tenantId,
      }).session(session);
      const plan = await Plan.findOne({
        _id: request.planId,
        createdBy: tenantId,
        active: true,
      }).session(session);
      const gym = await Gym.findOne({ ownerId: tenantId }).session(session);

      if (!member || !plan) {
        const error = new Error(
          "The member or selected plan is no longer available"
        );
        error.status = 409;
        throw error;
      }
      if (
        plan.name !== request.planName ||
        plan.duration !== request.durationMonths ||
        plan.price !== request.amount
      ) {
        const error = new Error(
          "The plan price or duration changed after submission. Reject this request and ask the member to submit it again."
        );
        error.status = 409;
        throw error;
      }

      const today = getTodayForGym(gym);
      const todayDate = dateKeyToUtcDate(today);
      const historyExists = await MembershipRecord.exists({
        tenantId,
        memberId: member._id,
      }).session(session);
      if (
        !historyExists &&
        member.active &&
        isValidMembershipDateRange(member)
      ) {
        const previousPlan = await Plan.findById(member.plan)
          .select("name price duration")
          .session(session)
          .lean();
        await MembershipRecord.create(
          [
            {
              tenantId,
              memberId: member._id,
              planId: member.plan,
              planName: previousPlan?.name || "Existing membership",
              durationMonths: previousPlan?.duration || 1,
              amount: previousPlan?.price || 0,
              membershipStart: member.membershipStart,
              membershipEnd: member.membershipEnd,
              rechargedAt: member.createdAt || member.membershipStart,
              paymentStatus: "not_recorded",
              approvalStatus: "approved",
              source: "legacy",
            },
          ],
          { session }
        );
      }

      const validMemberships = member.active
        ? await MembershipRecord.find({
            tenantId,
            memberId: member._id,
            approvalStatus: "approved",
            membershipEnd: { $gte: todayDate },
          })
            .sort({ membershipEnd: -1, membershipStart: -1, createdAt: -1 })
            .session(session)
            .lean()
        : [];
      let latestMembership =
        selectLatestMembershipRecord(validMemberships, { today });
      if (
        !latestMembership &&
        member.active &&
        isValidMembershipDateRange(member) &&
        member.membershipEnd >= todayDate
      ) {
        const currentPeriodRecorded = await MembershipRecord.exists({
          tenantId,
          memberId: member._id,
          planId: member.plan,
          membershipStart: member.membershipStart,
          membershipEnd: member.membershipEnd,
          approvalStatus: "approved",
        }).session(session);

        if (!currentPeriodRecorded) {
          const currentPlan = await Plan.findOne({
            _id: member.plan,
            createdBy: tenantId,
          })
            .select("name price duration")
            .session(session)
            .lean();
          const [legacyRecord] = await MembershipRecord.create(
            [
              {
                tenantId,
                memberId: member._id,
                planId: member.plan,
                planName: currentPlan?.name || "Existing membership",
                durationMonths: currentPlan?.duration || 1,
                amount: currentPlan?.price || 0,
                membershipStart: member.membershipStart,
                membershipEnd: member.membershipEnd,
                rechargedAt: member.createdAt || member.membershipStart,
                paymentStatus: "not_recorded",
                approvalStatus: "approved",
                source: "legacy",
              },
            ],
            { session }
          );
          latestMembership = legacyRecord.toObject();
        } else {
          latestMembership = selectLatestMembershipRecord(
            [
              {
                approvalStatus: "approved",
                membershipStart: member.membershipStart,
                membershipEnd: member.membershipEnd,
              },
            ],
            { today }
          );
        }
      }
      const { startDate, endDate } = calculateRechargeDates({
        membershipEnd: latestMembership?.membershipEnd,
        membershipActive: member.active && Boolean(latestMembership),
        durationDays: getPlanDurationDays(plan.duration),
        today,
      });
      const [record] = await MembershipRecord.create(
        [
          {
            tenantId,
            memberId: member._id,
            planId: plan._id,
            planName: plan.name,
            durationMonths: plan.duration,
            amount: plan.price,
            membershipStart: dateKeyToUtcDate(startDate),
            membershipEnd: dateKeyToUtcDate(endDate),
            rechargedAt: new Date(),
            paymentStatus: "verified",
            paymentMethod: "upi",
            approvalStatus: "approved",
            source: "recharge",
            transactionReference: request.transactionReference,
            rechargeRequestId: request._id,
            approvedBy: req.user.id,
          },
        ],
        { session }
      );
      await createGymBilling(record, tenantId, session);

      member.plan = plan._id;
      member.membershipStart = dateKeyToUtcDate(startDate);
      member.membershipEnd = dateKeyToUtcDate(endDate);
      member.active = true;
      await member.save({ session });

      request.membershipRecordId = record._id;
      await request.save({ session });
      approvedRequest = request;
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and membership extended",
      data: serializeRequest(approvedRequest),
    });
  } catch (error) {
    if (error.status || error.code === 11000) {
      return res.status(error.status || 409).json({
        success: false,
        message:
          error.message || "This recharge request has already been processed",
      });
    }

    if (
      error.code === 20 ||
      error.codeName === "IllegalOperation" ||
      /Transaction numbers are only allowed|replica set/i.test(error.message)
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Recharge approval requires MongoDB transactions. Configure MongoDB as a replica set and retry.",
      });
    }

    console.error("Approve recharge request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve recharge request",
    });
  } finally {
    if (session) await session.endSession();
  }
};

export const getMemberRechargeHistory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.memberId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }
    const tenantId = getRechargeTenantId(req.user);
    const member = await Member.findOne({
      _id: req.params.memberId,
      createdBy: tenantId,
    })
      .select("name +photoStorageKey")
      .lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const history = await MembershipRecord.find({
      tenantId,
      memberId: member._id,
    })
      .sort({ membershipStart: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: {
        member: serializeMemberPhoto(member),
        history: history.map(serializeMembershipRecord),
      },
    });
  } catch (error) {
    console.error("Get member recharge history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch member recharge history",
    });
  }
};

export const createAdminMemberRecharge = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.memberId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid member ID",
    });
  }

  const { planId, paymentMethod, amount, transactionReference } = req.body;
  const validPaymentMethods = [
    "cash",
    "upi",
    "card",
    "bank_transfer",
    "other",
  ];
  const receivedAmount = Number(amount);
  if (
    !mongoose.isValidObjectId(planId) ||
    !validPaymentMethods.includes(paymentMethod) ||
    !Number.isFinite(receivedAmount) ||
    receivedAmount < 0 ||
    receivedAmount > 1_000_000_000 ||
    (transactionReference !== undefined &&
      (typeof transactionReference !== "string" ||
        transactionReference.trim().length > 120))
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid plan, payment method, amount, and reference",
    });
  }

  const tenantId = getRechargeTenantId(req.user);
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
    let createdRecord;
    await session.withTransaction(async () => {
      const member = await Member.findOne({
        _id: req.params.memberId,
        createdBy: tenantId,
      }).session(session);
      const plan = await Plan.findOne({
        _id: planId,
        createdBy: tenantId,
        active: true,
      }).session(session);
      const gym = await Gym.findOne({ ownerId: tenantId }).session(session);

      if (!member || !plan) {
        const error = new Error(
          "Member or selected membership plan is unavailable"
        );
        error.status = 404;
        throw error;
      }

      const today = getTodayForGym(gym);
      const todayDate = dateKeyToUtcDate(today);
      const currentHistory = member.active
        ? await MembershipRecord.find({
            tenantId,
            memberId: member._id,
            approvalStatus: "approved",
            membershipEnd: { $gte: todayDate },
          })
            .sort({ membershipEnd: -1, membershipStart: -1, createdAt: -1 })
            .session(session)
            .lean()
        : [];
      let previousMembership = selectLatestMembershipRecord(currentHistory, {
        today,
      });

      if (
        !previousMembership &&
        member.active &&
        isValidMembershipDateRange(member) &&
        member.membershipEnd >= todayDate
      ) {
        const [legacyRecord] = await MembershipRecord.create(
          [
            {
              tenantId,
              memberId: member._id,
              planId: member.plan,
              planName: "Existing membership",
              durationMonths: 1,
              amount: 0,
              membershipStart: member.membershipStart,
              membershipEnd: member.membershipEnd,
              rechargedAt: member.createdAt || member.membershipStart,
              paymentStatus: "not_recorded",
              approvalStatus: "approved",
              source: "legacy",
            },
          ],
          { session }
        );
        previousMembership = legacyRecord.toObject();
      }

      const { startDate, endDate } = calculateRechargeDates({
        membershipEnd: previousMembership?.membershipEnd,
        membershipActive: member.active && Boolean(previousMembership),
        durationDays: getPlanDurationDays(plan.duration),
        today,
      });

      const [record] = await MembershipRecord.create(
        [
          {
            tenantId,
            memberId: member._id,
            planId: plan._id,
            planName: plan.name,
            durationMonths: plan.duration,
            amount: receivedAmount,
            membershipStart: dateKeyToUtcDate(startDate),
            membershipEnd: dateKeyToUtcDate(endDate),
            rechargedAt: new Date(),
            paymentStatus: "verified",
            paymentMethod,
            approvalStatus: "approved",
            source: "admin_recharge",
            transactionReference: transactionReference?.trim() || undefined,
            approvedBy: req.user.id,
          },
        ],
        { session }
      );
      await createGymBilling(record, tenantId, session);

      member.plan = plan._id;
      member.membershipStart = dateKeyToUtcDate(startDate);
      member.membershipEnd = dateKeyToUtcDate(endDate);
      member.active = true;
      await member.save({ session });
      createdRecord = record;
    });

    return res.status(201).json({
      success: true,
      message: "Member recharged successfully",
      data: serializeMembershipRecord(createdRecord),
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.code === 20 ||
      error.codeName === "IllegalOperation" ||
      /Transaction numbers are only allowed|replica set/i.test(error.message)
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Admin recharge requires MongoDB transactions. Configure MongoDB as a replica set and retry.",
      });
    }
    console.error("Create admin member recharge error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to recharge member",
    });
  } finally {
    if (session) await session.endSession();
  }
};

export const getRechargeProof = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recharge request ID",
      });
    }

    const request = await RechargeRequest.findOne(
      getRechargeRequestFilter(req.user, req.params.id)
    )
      .select("+proofStorageKey");
    const imagePath = getPrivateImagePath(request?.proofStorageKey);

    if (!imagePath) {
      return res.status(404).json({
        success: false,
        message: "Payment proof not found",
      });
    }

    return res.sendFile(imagePath, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Get recharge proof error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payment proof",
    });
  }
};
