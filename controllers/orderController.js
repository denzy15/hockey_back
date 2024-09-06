import Order from "../models/Order.js";

export const getOrders = async (req, res) => {
  const { _id } = req.query;

  try {
    if (_id) {
      const order = await Order.findById(_id);

      if (!order) {
        return res.status(404).send({ message: "Заказ не найден" });
      }

      return res.send(order);
    }

    const orders = await Order.find({}).sort({ createdAt: -1 });

    res.send(orders);
  } catch (error) {
    console.error("Ошибка при создании заказа:", error);
    res.status(500).send({ message: "Ошибка сервера" });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { name, phone, email, products } = req.body;

    // Проверяем, что все поля заполнены
    if (!name || !phone || !email || !products || products.length === 0) {
      return res
        .status(400)
        .send({ message: "Пожалуйста, заполните все поля." });
    }

    const totalPrice = products.reduce((total, product) => {
      return total + product.finalPrice * product.cartCounter;
    }, 0);

    // Создаем новый заказ
    const newOrder = new Order({
      name,
      phone,
      email,
      products,
      totalPrice,
    });

    // Сохраняем заказ в базе данных
    await newOrder.save();

    // Отправляем успешный ответ
    res
      .status(201)
      .send({ message: "Заказ успешно создан!", orderId: newOrder._id });
  } catch (error) {
    console.error("Ошибка при создании заказа:", error);
    res.status(500).send({ message: "Ошибка сервера" });
  }
};
