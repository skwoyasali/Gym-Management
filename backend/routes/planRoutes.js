import express from "express";

import {
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
} from "../controllers/planController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

router.get("/", getPlans);
router.post("/", createPlan);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

export default router;
