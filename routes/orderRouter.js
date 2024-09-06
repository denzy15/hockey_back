import express from "express";
import { createOrder, getOrders } from "../controllers/orderController.js";
import { checkTokenMiddleware } from "../middleware/checkToken.js";

const router = express.Router();

router.get("/", checkTokenMiddleware, getOrders);
router.post("/", createOrder);

export default router;
