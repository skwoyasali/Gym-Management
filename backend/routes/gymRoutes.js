import express from "express";

import { completeProfile } from "../controllers/gymController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.post(
  "/profile",
  authMiddleware,
  requireRole("admin"),
  completeProfile
);

export default router;