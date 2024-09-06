import Category from "../models/Category.js";
import Product from "../models/Product.js";
import {  deleteFile } from "../utils.js";
import path from "path";
import fs from "fs";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      basePrice,
      shortDescription,
      detailedDescription,
      category,
      parameters,
    } = req.body;

    const existingProduct = await Product.findOne({
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existingProduct) {
      return res.status(400).send({
        message: "Товар с таким именем уже существует",
      });
    }

    const parameterPhotos = req.files["parameterPhotos"] || [];

    const parsedParameters = JSON.parse(parameters).map((param) => {
      param.values = param.values.map((parVal, i) => {
        if (!parVal.photo) {
          return {
            value: parVal.value,
            defaultValue: parVal.defaultValue,
            extraPrice: parVal.extraPrice || null,
          };
        }

        const pathToPhoto = "parameters/" + parameterPhotos[i].filename;

        return {
          value: parVal.value,
          photo: pathToPhoto,
          defaultValue: parVal.defaultValue,
          extraPrice: parVal.extraPrice || null,
        };
      });

      return param;
    });

    const product = new Product({
      name,
      basePrice,
      shortDescription,
      detailedDescription,
      photo: "products/" + req.files["product"][0].filename,
      category,
      parameters: parsedParameters,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    await deleteFile(
      path.join(path.resolve(), "products", req.files["product"][0].filename)
    );

    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  const { name, category, _id } = req.query;

  try {
    if (_id) {
      const product = await Product.findById(_id);
      if (!product) {
        return res.status(404).send({ message: "Товар не найден" });
      }
      return res.status(200).send(product);
    }

    if (name) {
      const product = await Product.findOne({
        name: new RegExp(name, "i"),
      })
        .populate("category")
        .lean();

      if (!product) {
        return res.status(404).send({ message: "Товар не найден" });
      }
      return res.status(200).send(product);
    }

    if (category) {
      const existingCategory = await Category.findOne({ urlPath: category });

      if (!existingCategory) {
        return res.status(404).send({ message: "Категория не найдена" });
      }

      const products = await Product.find({ category: existingCategory._id })
        .populate("category")
        .lean();

      return res.status(200).send(products);
    }

    const products = await Product.find();
    res.status(200).send(products);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const deleteProductById = async (req, res) => {
  try {
    const { _id } = req.params;
    const product = await Product.findById(_id);

    if (!product) {
      return res.status(404).send({ message: "Товар не найден" });
    }

    const mainPhotoPath = path.join(path.resolve(), "assets", product.photo);

    if (product.parameters) {
      product.parameters.forEach((parameter) => {
        parameter.values.forEach(async (value) => {
          if (value.photo) {
            const parameterPhotoPath = path.join(
              path.resolve(),
              "assets",
              value.photo
            );
            await deleteFile(photoPath);
          }
        });
      });
    }

    await deleteFile(mainPhotoPath);

    await Product.deleteOne({ _id });
    res.status(200).send({ message: "Продукт удалён" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { _id } = req.params;
  let newPhotoPath;

  const paramsImagePaths = [];

  try {
    const existingProduct = await Product.findById(_id);
    if (!existingProduct) {
      return res.status(404).send({ message: "Товар не найден" });
    }

    // Деструктурируем данные из тела запроса
    const {
      name,
      basePrice,
      shortDescription,
      detailedDescription,
      category,
      parameters,
    } = req.body;

    // Проверяем данные на валидность
    if (
      !name ||
      !basePrice ||
      !shortDescription ||
      !detailedDescription ||
      !category
    ) {
      return res
        .status(400)
        .json({ message: "Пожалуйста, заполните все обязательные поля." });
    }

    let photoPathToDelete = existingProduct.photo;

    // Обновляем остальные поля товара
    existingProduct.name = name;
    existingProduct.basePrice = basePrice;
    existingProduct.shortDescription = shortDescription;
    existingProduct.detailedDescription = detailedDescription;
    existingProduct.category = category;

    // Проверяем, были ли загружены новые фотографии параметров
    let paramsCounter = 0;

    if (parameters) {
      const parsedParameters = JSON.parse(parameters).map(
        (param, paramIndex) => {
          param.values = param.values.map((parVal, valueIndex) => {
            if (!parVal.photo) {
              return {
                value: parVal.value,
                defaultValue: parVal.defaultValue,
                extraPrice: parVal.extraPrice || null,
              };
            }

            let pathToPhoto = parVal.photo;

            if (parVal.photoPreview) {
              pathToPhoto =
                "parameters/" +
                req.files["parameterPhotos"][paramsCounter++].filename;
              paramsImagePaths.push(pathToPhoto);
            }

            if (parVal.defaultValue) {
              existingProduct.photo = pathToPhoto;
            }

            return {
              value: parVal.value,
              photo: pathToPhoto,
              defaultValue: parVal.defaultValue,
              extraPrice: parVal.extraPrice || null,
            };
          });

          return param;
        }
      );

      existingProduct.parameters = parsedParameters;
    }

    if (req.files["product"]) {
      newPhotoPath = "products/" + req.files["product"][0].filename;
      existingProduct.photo = newPhotoPath;
    }

    await existingProduct.save();

    if (!!newPhotoPath) {
      const deletePath = path.join(path.resolve(), "assets", photoPathToDelete);
      await deleteFile(deletePath);
    }

    res.status(200).json(existingProduct);
  } catch (error) {
    console.error("Ошибка при обновлении продукта:", error.message);

    if (!!newPhotoPath) {
      const deletePath = path.join(path.resolve(), "assets", newPhotoPath);
      await deleteFile(deletePath);
    }

    for (const paramImagePath of paramsImagePaths) {
      const deletePath = path.join(path.resolve(), "assets", paramImagePath);
      await deleteFile(deletePath);
    }

    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export const deleteUnusedPhotos = async (req, res) => {
  const getAllPhotoPaths = async () => {
    const products = await Product.find({});
    const photoPaths = new Set();

    products.forEach((product) => {
      product.parameters.forEach((parameter) => {
        parameter.values.forEach((value) => {
          if (value.photo) {
            photoPaths.add(value.photo);
          }
        });
      });

      photoPaths.add(product.photo);
    });

    return photoPaths;
  };

  try {
    const photoPaths = await getAllPhotoPaths();
    const parameterPhotosDir = path.resolve("assets/parameters");
    const files = fs.readdirSync(parameterPhotosDir);
    const unusedFiles = files.filter(
      (file) => !photoPaths.has(`parameters/${file}`)
    );

    unusedFiles.forEach(async (file) => {
      await deleteFile(path.join(parameterPhotosDir, file));
    });

    res.status(200).json({
      message: `Найдено и удалено ${unusedFiles.length} ненужных файлов`,
    });
  } catch (error) {
    console.error(
      "Ошибка при проверке ненужных фотографий параметров:",
      error.message
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};
