import express from "express";

import { getPlans } from "../controllers/planController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getPlans);

export default router;
