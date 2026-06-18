// ===== API ДЛЯ РЕГИСТРАЦИИ =====

// Хранилище пользователей (общее с login.js)
if (!global.users) {
  global.users = {
    'test@mail.ru': { password: '123456', firstName: 'Иван', lastName: 'Иванов' }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Метод не разрешен' });
  }

  try {
    const { email, password, first_name, last_name, phone } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ success: false, message: 'Все поля обязательны' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Пароль минимум 6 символов' });
    }

    // Проверка: есть ли уже такой email
    if (global.users[email]) {
      return res.status(400).json({ success: false, message: 'Этот email уже зарегистрирован' });
    }

    // Сохраняю пользователя
    global.users[email] = {
      password: password,
      firstName: first_name,
      lastName: last_name,
      phone: phone || ''
    };

    return res.status(201).json({
      success: true,
      message: 'Регистрация успешна! Теперь вы можете войти.'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}