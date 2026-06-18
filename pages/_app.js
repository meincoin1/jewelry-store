// ===== ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ =====
// Этот файл оборачивает все страницы сайта

// Подключаю глобальные стили (будут работать на всех страницах)
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Component - текущая страница, pageProps - её данные
  // Просто отрисовываю страницу, которую запросил пользователь
  return <Component {...pageProps} />;
}

export default MyApp;