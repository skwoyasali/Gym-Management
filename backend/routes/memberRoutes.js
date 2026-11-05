import express from "express";

import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
} from "../controllers/memberController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";
import { createMemberActivationCode } from "../controllers/memberController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/", getMembers);

router.post("/", addMember);

router.post("/:id/activation-code", createMemberActivationCode);

router.put("/:id", updateMember);

router.delete("/:id", deleteMember);

export default router;