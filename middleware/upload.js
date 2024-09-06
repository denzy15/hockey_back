import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "";
    if (file.fieldname === "category") {
      folder = "assets/categories";
    } else if (file.fieldname === "product") {
      folder = "assets/products";
    } else if (file.fieldname.startsWith("parameterPhoto")) {
      folder = "assets/parameters";
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(
      file.originalname
    )}`;
    cb(null, filename);
  },
});

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempFolder = "assets/temp";
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true });
    }
    cb(null, tempFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(
      file.originalname
    )}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Неверный тип файла. Возможно загрузить только JPEG, PNG и GIF файлы."
      ),
      false
    );
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
