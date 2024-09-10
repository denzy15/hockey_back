import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { deleteImageFromCloudinary } from "../utils.js";

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

        const pathToPhoto = parameterPhotos[i].path;

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
      photo: req.files["product"][0].path,
      category,
      parameters: parsedParameters,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
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

    const products = await Product.find().populate("category").lean();
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

    await Product.deleteOne({ _id });

    if (product.parameters) {
      product.parameters.forEach((parameter) => {
        parameter.values.forEach(async (value) => {
          if (value.photo) {
            const parameterPhotoPublicId = value.photo
              .split("/")
              .pop()
              .split(".")[0];

            await deleteImageFromCloudinary("products", parameterPhotoPublicId);
          }
        });
      });
    }

    const mainPhotoPublicId = product.photo.split("/").pop().split(".")[0];

    await deleteImageFromCloudinary("products", mainPhotoPublicId);

    res.status(200).send({ message: "Продукт удалён" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { _id } = req.params;
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
    // Обновляем остальные поля товара
    existingProduct.name = name;
    existingProduct.basePrice = basePrice;
    existingProduct.shortDescription = shortDescription;
    existingProduct.detailedDescription = detailedDescription;
    existingProduct.category = category;

    const photoPathToDelete = existingProduct.photo;

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
              pathToPhoto = req.files["parameterPhotos"][paramsCounter++].path;
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

    let newPhotoPath;

    if (req.files["product"]) {
      newPhotoPath = req.files["product"][0].path;
      existingProduct.photo = newPhotoPath;
    }

    await existingProduct.save();

    if (!!newPhotoPath) {
      const mainPhotoPublicId = photoPathToDelete
        .split("/")
        .pop()
        .split(".")[0];

      await deleteImageFromCloudinary("products", mainPhotoPublicId);
    }

    res.status(200).json(existingProduct);
  } catch (error) {
    console.error("Ошибка при обновлении продукта:", error.message);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};
