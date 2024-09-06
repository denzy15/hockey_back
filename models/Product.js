import mongoose from "mongoose";

const ParameterValueSchema = new mongoose.Schema({
  value: { type: String, required: true, trim: true },
  photo: { type: String },
  extraPrice: { type: Number, min: [0, "Цена не может быть отрицательной"] },
  defaultValue: { type: Boolean, required: true },
});

const ParameterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  values: [ParameterValueSchema],
});

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: [0, "Цена не может быть отрицательной"],
    },
    shortDescription: { type: String, required: true },
    detailedDescription: { type: String, required: true },
    photo: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    parameters: [ParameterSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", ProductSchema);
