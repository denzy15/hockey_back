import mongoose from "mongoose";

const ParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: {
    value: { type: String, required: true },
    photo: { type: String },
    defaultValue: { type: Boolean },
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
});

const ProductSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  finalPrice: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  shortDescription: { type: String, required: true },
  photo: { type: String, required: true },
  category: {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
  },
  parameters: [ParameterSchema],
  cartCounter: { type: Number, required: true, min: 1 },
});

const OrderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  products: [ProductSchema],
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", OrderSchema);
