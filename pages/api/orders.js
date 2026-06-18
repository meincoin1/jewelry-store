// ===== API ДЛЯ ОФОРМЛЕНИЯ ЗАКАЗОВ =====
export default async function handler(req, res) {
  // Проверяю, что запрос отправлен методом POST (из формы)
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Метод не разрешен' });
  }

  try {
    // Получаю данные, которые пользователь ввёл в форму заказа
    const { customer_name, phone, email, product_name, price } = req.body;

    // Вывожу заказ в консоль сервера, чтобы видеть что заказывают
    console.log('Заказ:', { customer_name, product_name, price });

    // Проверяю, что имя и товар точно указаны (обязательные поля)
    if (!customer_name || !product_name) {
      return res.status(400).json({ success: false, message: 'Имя и товар обязательны' });
    }

    // Если всё хорошо - заказ принят, отправляю успешный ответ
    return res.status(201).json({
      success: true,
      message: 'Заказ успешно оформлен! Мы свяжемся с вами.',
      orderId: Date.now() // Генерирую уникальный номер заказа
    });

  } catch (error) {
    // Если произошла ошибка на сервере
    console.error('Ошибка:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}