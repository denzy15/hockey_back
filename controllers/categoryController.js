import Category from "../models/Category.js";
import { deleteImageFromCloudinary } from "../utils.js";

export const createCategory = async (req, res) => {
  const photoUrl = req.file.path;
  try {
    const { name, urlPath } = req.body;

    // Проверка на существование категории с таким же именем или urlPath
    const existingCategory = await Category.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, "i") },
        { urlPath: new RegExp(`^${urlPath}$`, "i") },
      ],
    });

    if (existingCategory) {
      return res.status(400).send({
        message:
          existingCategory.name === name
            ? "Категория с таким именем уже существует"
            : "Категория с таким URL путем уже существует",
      });
    }

    const category = new Category({
      name,
      photo: req.file.path,
      urlPath,
    });

    await category.save();
    res.status(201).send(category);
  } catch (error) {

    if (photoUrl) {
      const publicId = photoUrl.split("/").pop().split(".")[0];
      await deleteImageFromCloudinary("categories", publicId);
    }

    res.status(500).send({ message: "Ошибка сервера" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).send(categories);
  } catch (error) {
    res.status(500).send({ message: "Ошибка сервера" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { _id } = req.params;
    const category = await Category.findById(_id);

    if (!category) {
      return res.status(404).send({ message: "Категория не найдена" });
    }

    res.status(200).send(category);
  } catch (error) {
    res.status(500).send({ message: "Ошибка сервера" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, urlPath } = req.body;
    const { _id } = req.params;

    const currentCategory = await Category.findById(_id);

    if (!currentCategory) {
      return res.status(404).send({ message: "Категория не найдена" });
    }

    // Проверка на существование категории с таким же именем или urlPath
    const existingCategory = await Category.findOne({
      $or: [{ name: new RegExp(`^${name}$`, "i") }],
    });

    if (existingCategory && existingCategory._id.toString() !== _id) {
      return res.status(400).send({
        message: "Категория с таким именем уже существует",
      });
    }

    const oldPhotoPublicId = currentCategory.photo
      .split("/")
      .pop()
      .split(".")[0];

    currentCategory.name = name;
    currentCategory.urlPath = urlPath;

    currentCategory.photo = req.file ? req.file.path : currentCategory.photo;

    await currentCategory.save();

    if (req.file) {
      await deleteImageFromCloudinary("categories", oldPhotoPublicId);
    }

    res.status(201).send(currentCategory);
  } catch (error) {
    res.status(500).send({ message: "Ошибка сервера" });
  }
};

export const deleteCategoryById = async (req, res) => {
  try {
    const { _id } = req.params;

    const category = await Category.findById(_id);

    if (!category) {
      return res.status(404).send({ message: "Категория не найдена" });
    }

    await Category.deleteOne({ _id });

    if (category.photo) {
      const publicId = category.photo.split("/").pop().split(".")[0];
      await deleteImageFromCloudinary("categories", publicId);
    }
    res.status(200).send({ message: "Категория удалена" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
