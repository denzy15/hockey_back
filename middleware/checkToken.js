import jwt from "jsonwebtoken";

export const checkTokenMiddleware = (req, res, next) => {
  const token = req.header("Authorization").split(" ")[1];
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

    next();
  } catch (error) {
    res.status(401).json({ message: "Неверный токен авторизации" });
  }
};
