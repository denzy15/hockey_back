import express from "express";
import {
  createProduct,
  deleteProductById,
  
  getProducts,
  updateProduct,
} from "../controllers/productController.js";
import { uploadMiddleware } from "../middleware/upload.js"; // Обновленный импорт
import { checkTokenMiddleware } from "../middleware/checkToken.js";

const router = express.Router();

const cpUpload = uploadMiddleware("products").fields([
  { name: "product", maxCount: 1 },
  { name: "parameterPhotos", maxCount: 10 },
]);

router.post("/", checkTokenMiddleware, cpUpload, createProduct);
router.get("/", getProducts);
router.delete("/:_id", checkTokenMiddleware, deleteProductById);
router.put("/:_id", checkTokenMiddleware, cpUpload, updateProduct);

export default router;
