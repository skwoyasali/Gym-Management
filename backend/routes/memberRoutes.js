import express from "express";

import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
} from "../controllers/memberController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMembers);

router.post("/", addMember);

router.put("/:id", updateMember);

router.delete("/:id", deleteMember);

export default router;