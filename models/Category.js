import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  urlPath: { type: String, required: true, unique: true },
  photo: { type: String, required: true },
});

export default mongoose.model("Category", CategorySchema);
