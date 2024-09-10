import express from "express";
import {
  deleteUnusedPhotos,
  loginAndGenerateToken,
  verifyToken,
} from "../controllers/adminController.js";
import { checkTokenMiddleware } from "../middleware/checkToken.js";

const router = express.Router();

router.post("/auth", loginAndGenerateToken);

router.post("/verify-token", verifyToken);

router.put("/clear-images", checkTokenMiddleware, deleteUnusedPhotos);

export default router;
