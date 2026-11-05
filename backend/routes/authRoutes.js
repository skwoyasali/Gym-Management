import express from "express";

import {
  register,
  login,
  activateMember,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/activate-member", activateMember);

export default router;
