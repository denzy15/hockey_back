import { deleteImageFromCloudinary, generateJWT } from "../utils.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import Product from "../models/Product.js";
import { v2 as cloudinary } from "cloudinary";
import Category from "../models/Category.js";

export const loginAndGenerateToken = async (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME
  ) {
    return res.status(400).send({ message: "Неверные данные для входа" });
  }

  bcrypt.compare(password, process.env.ADMIN_PASSWORD, (err, result) => {
    if (!result) {
      return res.status(401).json({ message: "Неверные данные для входа" });
    }
  });

  try {
    const token = generateJWT();

    res.send({ token });
  } catch (error) {
    res.status(500).send({ message: "Ошибка сервера" });
  }
};

export const verifyToken = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Отсутствует токен авторизации" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: "Истек срок действия токена" });
    }

    if (
      decoded.username !== process.env.ADMIN_USERNAME ||
      decoded.password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(403).json({ message: "Недостаточно прав доступа" });
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(401).json({ message: "Неверный токен авторизации" });
  }
};


const getAllProductPhotoPaths = async () => {
  const products = await Product.find({});
  const photoPaths = new Set();

  products.forEach((product) => {
    product.parameters.forEach((parameter) => {
      parameter.values.forEach((value) => {
        if (value.photo) {
          const publicId = value.photo.split("/").pop().split(".")[0];
          photoPaths.add(`products/${publicId}`);
        }
      });
    });

    if (product.photo) {
      const publicId = product.photo.split("/").pop().split(".")[0];
      photoPaths.add(`products/${publicId}`);
    }
  });

  return photoPaths;
};

const getAllCategoriesPhotoPaths = async () => {
  const categories = await Category.find({});
  const photoPaths = new Set();

  categories.forEach((category) => {
    if (category.photo) {
      const publicId = category.photo.split("/").pop().split(".")[0];
      photoPaths.add(`categories/${publicId}`);
    }
  });

  return photoPaths;
};

export const deleteUnusedPhotos = async (req, res) => {
  try {
    const productPhotoPaths = await getAllProductPhotoPaths();
    const categoryPhotoPaths = await getAllCategoriesPhotoPaths();

    const allPhotoPaths = new Set([
      ...productPhotoPaths,
      ...categoryPhotoPaths,
    ]);

    

    // Получаем список всех изображений в Cloudinary для товаров и категорий
    const allCloudinaryPhotos = await cloudinary.api.resources({
      type: "upload",
      prefix: "", // Подходит для всех изображений
      max_results: 1000, // Можно увеличить при необходимости
    });

    
    const unusedFiles = allCloudinaryPhotos.resources.filter((file) => {
      const publicId = file.public_id;

      return !allPhotoPaths.has(publicId);
    });

    // Удаляем ненужные фотографии из Cloudinary
    for (const file of unusedFiles) {
      const folder = file.public_id.split("/")[0];
      const publicId = file.public_id.split("/").pop();
      await deleteImageFromCloudinary(folder, publicId);
    }

    res.status(200).json({
      message: `Найдено и удалено ${unusedFiles.length} ненужных файлов`,
    });
  } catch (error) {
    console.error("Ошибка при очистке ненужных фотографий:", error.message);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};
