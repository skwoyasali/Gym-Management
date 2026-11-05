import express from "express";

import {
  checkInMember,
  getMemberAttendance,
  getTenantAttendance,
} from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", requireRole("admin"), getTenantAttendance);
router.get("/mine", requireRole("member"), getMemberAttendance);
router.post("/check-in", requireRole("member"), checkInMember);

export default router;
