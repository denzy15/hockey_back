import express from "express";
import {
  loginAndGenerateToken,
  verifyToken,
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/auth", loginAndGenerateToken);

router.post("/verify-token", verifyToken);

export default router;
