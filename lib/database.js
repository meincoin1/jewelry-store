let Database;

// Проверяю, что я на сервере
if (typeof window === 'undefined') {
  Database = require('better-sqlite3');
}

const path = require('path');

function getDatabase() {
  // Проверка, что код выполняется на сервере
  if (typeof window !== 'undefined') {
    throw new Error('База данных доступна только на сервере');
  }

  const dbPath = path.join(process.cwd(), 'jewelry.db');
  const db = new Database(dbPath);

  // Включаем WAL режим
  db.pragma('journal_mode = WAL');

  return db;
}

// Функция для инициализации таблиц
export function initializeDatabase() {
  if (typeof window !== 'undefined') {
    console.log('Пропускаем инициализацию БД на клиенте');
    return;
  }

  const db = getDatabase();

  try {
    // Таблица пользователей
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        failed_attempts INTEGER DEFAULT 0,
        blocked_until TEXT DEFAULT NULL,
        is_blocked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // Таблица заказов
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        product_name TEXT NOT NULL,
        price REAL DEFAULT 0,
        status TEXT DEFAULT 'новый',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('База данных инициализирована успешно');
  } catch (error) {
    console.error('Ошибка инициализации БД:', error);
  } finally {
    db.close();
  }
}

export default getDatabase;