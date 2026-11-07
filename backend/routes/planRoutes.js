import express from "express";

import { createPlan, getPlans } from "../controllers/planController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

router.get("/", getPlans);
router.post("/", createPlan);

export default router;
