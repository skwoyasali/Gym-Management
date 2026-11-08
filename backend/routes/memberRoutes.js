import express from "express";

import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  createMemberActivationCode,
  getMemberPhoto,
} from "../controllers/memberController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";
import { uploadImage } from "../middleware/imageUpload.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/:id/photo",
  requireRole("admin", "member"),
  getMemberPhoto
);

router.get("/", requireRole("admin"), getMembers);

router.use(requireRole("admin"));

router.post("/", uploadImage("photo"), addMember);

router.post("/:id/activation-code", createMemberActivationCode);

router.put("/:id", uploadImage("photo"), updateMember);

router.delete("/:id", deleteMember);

export default router;