import express from "express";

import {
  completeProfile,
  deleteGymPaymentQr,
  getGymPaymentQr,
  getGymPaymentSettings,
  updateGymPaymentSettings,
  uploadGymPaymentQr,
} from "../controllers/gymController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/imageUpload.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.post(
  "/profile",
  authMiddleware,
  requireRole("admin"),
  completeProfile
);
router.get(
  "/payment-settings",
  authMiddleware,
  requireRole("admin"),
  getGymPaymentSettings
);
router.put(
  "/payment-settings",
  authMiddleware,
  requireRole("admin"),
  updateGymPaymentSettings
);
router.post(
  "/payment-qr",
  authMiddleware,
  requireRole("admin"),
  uploadImage("qr"),
  uploadGymPaymentQr
);
router.delete(
  "/payment-qr",
  authMiddleware,
  requireRole("admin"),
  deleteGymPaymentQr
);
router.get(
  "/payment-qr",
  authMiddleware,
  requireRole("admin", "member"),
  getGymPaymentQr
);

export default router;