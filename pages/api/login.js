// ===== API ДЛЯ ВХОДА =====

const loginAttempts = {};

// Общее хранилище с register.js
if (!global.users) {
  global.users = {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Метод не разрешен' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email и пароль обязательны' });
    }

    // Проверка блокировки
    const userAttempts = loginAttempts[email];

    if (userAttempts && userAttempts.blockedUntil) {
      const now = Date.now();
      
      if (now < userAttempts.blockedUntil) {
        const minutesLeft = Math.ceil((userAttempts.blockedUntil - now) / 60000);
        return res.status(403).json({
          success: false,
          message: `Аккаунт заблокирован. Попробуйте через ${minutesLeft} мин.`
        });
      } else {
        delete loginAttempts[email];
      }
    }

    // Ищу пользователя в хранилище
    const user = global.users[email];

    // Проверяю пароль
    if (user && password === user.password) {
      // УСПЕШНЫЙ ВХОД
      delete loginAttempts[email];

      return res.status(200).json({
        success: true,
        message: 'Вход выполнен успешно',
        token: 'token_' + Date.now(),
        user: {
          email: email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || ''
        }
      });
    }

    // НЕВЕРНЫЙ ПАРОЛЬ
    if (!loginAttempts[email]) {
      loginAttempts[email] = { attempts: 0 };
    }
    
    loginAttempts[email].attempts += 1;
    const attemptsLeft = 3 - loginAttempts[email].attempts;

    if (loginAttempts[email].attempts >= 3) {
      loginAttempts[email].blockedUntil = Date.now() + 15 * 60 * 1000;
      return res.status(403).json({
        success: false,
        message: 'Аккаунт заблокирован на 15 минут'
      });
    }

    return res.status(401).json({
      success: false,
      message: `Неверный email или пароль. Осталось попыток: ${attemptsLeft}`
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}