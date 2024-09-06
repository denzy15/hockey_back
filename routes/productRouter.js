import express from "express";
import {
  createProduct,
  deleteProductById,
  deleteUnusedPhotos,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import { checkTokenMiddleware } from "../middleware/checkToken.js";

const router = express.Router();

const cpUpload = upload.fields([
  { name: "product", maxCount: 1 },
  { name: "parameterPhotos", maxCount: 10 },
]);

router.post("/", checkTokenMiddleware, cpUpload, createProduct);
router.get("/", getProducts);
router.delete("/:_id", checkTokenMiddleware, deleteProductById);
router.put("/:_id", checkTokenMiddleware, cpUpload, updateProduct);
router.put(
  "/clear/params-images",
  checkTokenMiddleware,
  deleteUnusedPhotos
);

export default router;
