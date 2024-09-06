import Category from "../models/Category.js";
import path from "path";
import { deleteFile } from "../utils.js";

export const createCategory = async (req, res) => {
  try {
    const { name, urlPath } = req.body;
    const cleanedUrlPath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;

    // Проверка на существование категории с таким же именем или urlPath
    const existingCategory = await Category.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, "i") },
        { urlPath: new RegExp(`^${cleanedUrlPath}$`, "i") },
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
      photo: "categories/" + req.file.filename,
      urlPath: cleanedUrlPath,
    });

    await category.save();
    res.status(201).send(category);
  } catch (error) {
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
    const cleanedUrlPath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;

    const currentCategory = await Category.findById(_id);

    if (!currentCategory) {
      return res.status(404).send({ message: "Категория не найдена" });
    }

    // Проверка на существование категории с таким же именем или urlPath
    const existingCategory = await Category.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, "i") },
        { urlPath: new RegExp(`^${cleanedUrlPath}$`, "i") },
      ],
    });

    if (existingCategory && existingCategory._id.toString() !== _id) {
      return res.status(400).send({
        message:
          existingCategory.name === name
            ? "Категория с таким именем уже существует"
            : "Категория с таким URL путем уже существует",
      });
    }

    const oldPhotoPath = path.join(
      path.resolve(),
      "assets",
      currentCategory.photo
    );

    currentCategory.name = name;
    currentCategory.urlPath = cleanedUrlPath;

    currentCategory.photo = req.file
      ? "categories/" + req.file.filename
      : currentCategory.photo;

    await currentCategory.save();

    if (req.file) await deleteFile(oldPhotoPath);

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
      const photoPath = path.join(path.resolve(), "assets", category.photo);
      await deleteFile(photoPath);
    }
    res.status(200).send({ message: "Категория удалена" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
