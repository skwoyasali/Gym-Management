import express from "express";

import { getDashboardSummary } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

router.get("/summary", getDashboardSummary);

export default router;
