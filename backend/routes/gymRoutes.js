import express from "express";

import { completeProfile } from "../controllers/gymController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/profile",
  authMiddleware,
  completeProfile
);

export default router;