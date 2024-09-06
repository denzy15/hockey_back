import express from "express";
import {
  createCategory,
  deleteCategoryById,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/categoryController.js";
import upload from "../middleware/upload.js";
import { checkTokenMiddleware } from "../middleware/checkToken.js";

const router = express.Router();

router.post(
  "/",
  checkTokenMiddleware,
  upload.single("category"),
  createCategory
);
router.get("/", getCategories);
router.get("/:_id", getCategoryById);
router.put("/:_id", upload.single("category"), updateCategory);
router.delete("/:_id", deleteCategoryById);

export default router;
