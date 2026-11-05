import express from "express";

import { getPlans } from "../controllers/planController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

router.get("/", getPlans);

export default router;
