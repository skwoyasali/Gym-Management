import express from "express";
import {
  getMemberRechargeHistory,
  getMemberRechargeOverview,
  createAdminMemberRecharge,
  getRechargeProof,
  getRechargeRequests,
  reviewRechargeRequest,
  submitRechargeRequest,
} from "../controllers/rechargeController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/imageUpload.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", requireRole("member"), getMemberRechargeOverview);
router.post(
  "/requests",
  requireRole("member"),
  uploadImage("proof"),
  submitRechargeRequest
);
router.get(
  "/requests/:id/proof",
  requireRole("admin", "member"),
  getRechargeProof
);
router.get(
  "/admin/requests",
  requireRole("admin"),
  getRechargeRequests
);
router.post(
  "/admin/requests/:id/:action",
  requireRole("admin"),
  reviewRechargeRequest
);
router.get(
  "/admin/members/:memberId/history",
  requireRole("admin"),
  getMemberRechargeHistory
);
router.post(
  "/admin/members/:memberId/recharge",
  requireRole("admin"),
  createAdminMemberRecharge
);

export default router;
