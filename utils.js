import jwt from "jsonwebtoken";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

export const decodeString = (str) => {
  const byteArray = Array.from(str).map((char) => char.charCodeAt(0));
  const decodedString = new TextDecoder("utf-8").decode(
    new Uint8Array(byteArray)
  );

  return decodedString;
};

export const generateJWT = () => {
  return jwt.sign(
    {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "14d",
    }
  );
};

export const deleteFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.error(`Ошибка при удалении файла ${filePath}: ${error}`);
  }
};

export const deleteImageFromCloudinary = async (folderName, publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(
      folderName + "/" + publicId
    );
    return result;
  } catch (error) {
    console.error("Ошибка удаления изображения из Cloudinary:", error);
    throw new Error("Не удалось удалить изображение.");
  }
};
