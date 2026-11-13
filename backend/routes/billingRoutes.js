import express from "express";
import { getGymBilling } from "../controllers/billingController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", authMiddleware, requireRole("admin"), getGymBilling);

export default router;
