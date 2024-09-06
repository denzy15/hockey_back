import { generateJWT } from "../utils.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

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
