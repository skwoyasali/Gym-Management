import express from "express";
import {
  getPlatformPricing,
  getSuperAdminDashboard,
  getSuperAdminGymDetails,
  listSuperAdminBilling,
  listSuperAdminGyms,
  recordGymPayment,
  updatePlatformPricing,
  updateSuperAdminGym,
} from "../controllers/billingController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware, requireRole("super_admin"));

router.get("/dashboard", getSuperAdminDashboard);
router.get("/gyms", listSuperAdminGyms);
router.get("/gyms/:id", getSuperAdminGymDetails);
router.patch("/gyms/:id", updateSuperAdminGym);
router.get("/billing", listSuperAdminBilling);
router.post("/billing/:id/payments", recordGymPayment);
router.get("/pricing", getPlatformPricing);
router.put("/pricing", updatePlatformPricing);

export default router;
