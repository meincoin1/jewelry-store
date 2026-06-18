import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  // Состояния для управления интерфейсом
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({ name: '', price: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [user, setUser] = useState(null);

  // Проверяю, заходил ли пользователь раньше (беру из памяти браузера)
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Маска телефона: +7 (___) ___-__-__
  const phoneMask = (value) => {
    if (!value) return '';
    value = value.replace(/\D/g, '').substring(0, 11);
    if (value.length <= 1) return '+7 (' + value;
    if (value.length <= 4) return '+7 (' + value.substring(1, 4) + ') ' + value.substring(4);
    if (value.length <= 7) return '+7 (' + value.substring(1, 4) + ') ' + value.substring(4, 7) + '-' + value.substring(7);
    if (value.length <= 9) return '+7 (' + value.substring(1, 4) + ') ' + value.substring(4, 7) + '-' + value.substring(7, 9) + '-' + value.substring(9);
    return '+7 (' + value.substring(1, 4) + ') ' + value.substring(4, 7) + '-' + value.substring(7, 9) + '-' + value.substring(9, 11);
  };

  const handlePhoneInput = (e) => { e.target.value = phoneMask(e.target.value); };

  // Показываю уведомление на 5 секунд
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Выход из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showMessage('Вы вышли из аккаунта', 'warning');
  };

  // Отправка данных регистрации на сервер
  const handleRegister = async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.password.value !== form.password_confirm.value) { showMessage('Пароли не совпадают!', 'danger'); return; }
    try {
      const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.value, password: form.password.value, first_name: form.first_name.value, last_name: form.last_name.value, phone: form.phone?.value || '' }) });
      const data = await res.json();
      if (data.success) { showMessage('Регистрация успешна!', 'success'); setShowRegisterModal(false); setShowLoginModal(true); form.reset(); }
      else showMessage(data.message || 'Ошибка', 'danger');
    } catch { showMessage('Ошибка соединения', 'danger'); }
  };

  // Отправка данных входа на сервер
  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.value, password: form.password.value }) });
      const data = await res.json();
      if (data.success) { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); setUser(data.user); showMessage(`Добро пожаловать, ${data.user.firstName}!`, 'success'); setShowLoginModal(false); form.reset(); }
      else showMessage(data.message || 'Ошибка', 'danger');
    } catch { showMessage('Ошибка соединения', 'danger'); }
  };

  // Отправка заказа на сервер
  const handleOrder = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: user ? `${user.firstName} ${user.lastName}` : form.name.value, phone: form.phone.value, email: user ? user.email : form.email?.value || '', product_name: form.product.value, price: 0, comment: form.comment?.value || '' }) });
      const data = await res.json();
      if (data.success) { showMessage('Заказ оформлен!', 'success'); form.reset(); }
      else showMessage(data.message || 'Ошибка', 'danger');
    } catch { showMessage('Ошибка соединения', 'danger'); }
  };

  // Быстрый заказ из каталога
  const handleQuickOrder = async (productName, price) => {
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: user ? `${user.firstName} ${user.lastName}` : 'Клиент', product_name: productName, price: price }) });
      const data = await res.json();
      if (data.success) { showMessage(`Заказ "${productName}" оформлен!`, 'success'); setShowOrderModal(false); }
      else showMessage(data.message || 'Ошибка', 'danger');
    } catch { showMessage('Ошибка соединения', 'danger'); }
  };

  // Заказ обратного звонка
  const handleCallOrder = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: user ? `${user.firstName} ${user.lastName}` : form.name.value, phone: form.phone.value, product_name: 'Заказ звонка', price: 0, comment: form.comment?.value || '' }) });
      const data = await res.json();
      if (data.success) { showMessage('Заявка принята!', 'success'); setShowCallModal(false); form.reset(); }
      else showMessage('Ошибка', 'danger');
    } catch { showMessage('Ошибка соединения', 'danger'); }
  };

  const openOrderModal = (name, price) => { setSelectedProduct({ name, price }); setShowOrderModal(true); };

  // Товары для каталога
  const catalogProducts = [
    { img: 'images/ring-1.jpg', name: 'Кольцо с бриллиантом', desc: 'Комбинированное золото 585 пробы, украшено 5 бриллиантами.', price: '85 600 ₽', priceNum: 85600 },
    { img: 'images/ring-2.jpg', name: 'Серьги из серебра', desc: 'Комбинированное золото 585 пробы, размер 15.5, вес 6.01 г.', price: '54 300 ₽', priceNum: 54300 },
    { img: 'images/ring-3.jpg', name: 'Золотая цепочка', desc: 'Золото 585 пробы, парные обручальные кольца.', price: '65 800 ₽', priceNum: 65800 },
    { img: 'images/ring-4.jpg', name: 'Кулон с изумрудом', desc: 'Золото 585 пробы, с бриллиантами.', price: '124 500 ₽', priceNum: 124500 }
  ];

  // Товары для прайс-листа
  const priceProducts = [
    { name: 'Серьги-гвоздики с фианитами', material: 'Серебро 925 пробы', weight: '4.2', price: '9 800', priceNum: 9800 },
    { name: 'Браслет из белого золота', material: 'Золото 750 пробы', weight: '12.5', price: '89 500', priceNum: 89500 },
    { name: 'Подвеска-сердце с бриллиантом', material: 'Золото 585 пробы', weight: '5.8', price: '52 300', priceNum: 52300 },
    { name: 'Колье жемчужное', material: 'Серебро 925 пробы, жемчуг', weight: '22.4', price: '34 700', priceNum: 34700 }
  ];

  // Отзывы
  const reviews = [
    { img: 'images/review-1.jpg', name: 'Милана М.', text: '"Заказывала обручальные кольца. Очень довольна! Качество на высоте."', date: '15 марта 2025 г.' },
    { img: 'images/review-2.webp', name: 'Елена О.', text: '"Заказывала колье. Шикарно! Выполнили все пожелания."', date: '2 февраля 2025 г.' },
    { img: 'images/review-3.jpg', name: 'Дмитрий К.', text: '"Покупал цепочку. Сын в восторге! Спасибо за сервис."', date: '10 января 2025 г.' }
  ];

  return (
    <>
      {/* Подключаю шрифты и стили */}
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ювелирный магазин "ЭДО"</title>
        <link rel="icon" href="images/logo.png" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </Head>

      {/* Всплывающее уведомление */}
      {message.text && <div style={{ position: 'fixed', top: '90px', right: '20px', zIndex: 9999 }}><div className={`alert alert-${message.type}`}>{message.text}</div></div>}

      {/* Шапка сайта с навигацией */}
      <header className="fixed-top">
        <nav className="navbar navbar-expand-lg navbar-light py-3">
          <div className="container">
            <div><img src="images/logo.png" className="logo-brand" alt="Логотип" /></div>
            <a className="navbar-brand" href="#">ЭДО</a>
            <button className="navbar-toggler" onClick={() => setShowMobileMenu(!showMobileMenu)}><span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span></button>
            <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''}`}>
              <ul className="navbar-nav mx-auto">
                <li className="nav-item mx-2"><a className="nav-link" href="#advantages">О нас</a></li>
                <li className="nav-item mx-2"><a className="nav-link" href="#catalog">Каталог</a></li>
                <li className="nav-item mx-2"><a className="nav-link" href="#advantages">Преимущества</a></li>
                <li className="nav-item mx-2"><a className="nav-link" href="#prices">Прайс-лист</a></li>
                <li className="nav-item mx-2"><a className="nav-link" href="#testimonials">Отзывы</a></li>
                <li className="nav-item mx-2"><a className="nav-link" href="#contacts">Контакты</a></li>
              </ul>
              <div className="d-flex align-items-center gap-2">
                {/* Если пользователь вошёл - показываю имя и кнопку выхода */}
                {user ? (
                  <>
                    <span className="text-white me-2"><i className="fas fa-user-circle me-1"></i>{user.firstName}</span>
                    <button className="btn btn-outline-dark text-white btn-sm" onClick={handleLogout}><i className="fas fa-sign-out-alt me-1"></i>Выйти</button>
                  </>
                ) : (
                  /* Если не вошёл - кнопки Заказать звонок и Войти */
                  <>
                    <button className="btn btn-call me-2 text-white" onClick={() => setShowCallModal(true)}>Заказать звонок</button>
                    <button className="btn btn-outline-dark text-white" onClick={() => setShowLoginModal(true)}>Войти</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Видео-фон на главном экране */}
        <section className="hero-section">
          <div className="hero-video-wrapper">
            <video autoPlay muted loop playsInline className="hero-video">
              <source src="/video/background-video.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="hero-overlay"></div>
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6">
                <h1 className="display-5 fw-bold mb-4 text-white">Ювелирные украшения высшего качества</h1>
                <p className="lead mb-4 text-white">Изготовление и продажа эксклюзивных ювелирных изделий из драгоценных металлов и камней.</p>
                <a href="#order" className="btn btn-outline btn-lg">Оформить заказ</a>
              </div>
            </div>
          </div>
        </section>

        {/* Блок преимуществ */}
        <section id="advantages" className="py-5" style={{ backgroundColor: '#1b1919' }}>
          <div className="container"><h2 className="section-title text-center mb-5">Наши преимущества</h2>
            <div className="row g-4 text-white">
              {[{ icon: 'fa-gem', title: 'Качество', desc: 'Драгоценные металлы с сертификатами.' }, { icon: 'fa-user-cog', title: 'Подход', desc: 'Изготовление по эскизам.' }, { icon: 'fa-award', title: 'Мастера', desc: 'Многолетний опыт.' }, { icon: 'fa-shield-alt', title: 'Гарантия', desc: 'На все изделия.' }].map((item, i) => (<div key={i} className="col-md-3 col-sm-6"><div className="text-center"><div className="advantage-icon"><i className={`fas ${item.icon}`}></i></div><h5>{item.title}</h5><p className="text-white-50">{item.desc}</p></div></div>))}
            </div></div>
        </section>

        {/* Каталог товаров (десктоп + мобильная карусель) */}
        <section id="catalog" className="py-5" style={{ backgroundColor: '#1b1919' }}>
          <div className="container"><h2 className="section-title text-center mb-5">Каталог изделий</h2>
            <div className="catalog-grid"><div className="row g-4 text-white">{catalogProducts.map((p, i) => (<div key={i} className="col-lg-3 col-md-6"><div className="product-card"><img src={p.img} alt={p.name} className="product-img" /><div className="p-3"><p className="small text-white">{p.desc}</p><div className="d-flex justify-content-between align-items-center mt-3"><span className="product-price">{p.price}</span><button className="btn btn-sm btn-outline-primary" onClick={() => openOrderModal(p.name, p.priceNum)}>Заказать</button></div></div></div></div>))}</div></div>
            <div className="catalog-carousel"><div id="productCarousel" className="carousel slide" data-bs-ride="carousel"><div className="carousel-inner">{catalogProducts.map((p, i) => (<div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}><div className="product-card"><img src={p.img} alt={p.name} className="product-img" /><div className="p-3"><p className="small text-white">{p.desc}</p><div className="d-flex justify-content-between align-items-center mt-3"><span className="product-price">{p.price}</span><button className="btn btn-sm btn-outline-primary" onClick={() => openOrderModal(p.name, p.priceNum)}>Заказать</button></div></div></div></div>))}</div><button className="carousel-control-prev" data-bs-target="#productCarousel" data-bs-slide="prev"><span className="carousel-control-prev-icon"></span></button><button className="carousel-control-next" data-bs-target="#productCarousel" data-bs-slide="next"><span className="carousel-control-next-icon"></span></button></div></div>
          </div>
        </section>

        {/* Прайс-лист (таблица для ПК + карточки для мобильных) */}
        <section id="prices" className="py-5" style={{ backgroundColor: '#1b1919' }}>
          <div className="container"><h2 className="section-title text-center mb-5">Прайс-лист</h2>
            <div className="table-responsive"><table className="price-table"><thead><tr><th>Изделие</th><th>Материал</th><th>Вес, г</th><th>Цена, ₽</th><th></th></tr></thead><tbody>{priceProducts.map((item, i) => (<tr key={i}><td>{item.name}</td><td>{item.material}</td><td>{item.weight}</td><td className="product-price">{item.price}</td><td><button className="btn btn-sm btn-outline-primary" onClick={() => openOrderModal(item.name, item.priceNum)}>Заказать</button></td></tr>))}</tbody></table></div>
            <div className="mobile-price-list">{priceProducts.map((item, i) => (<div key={i} className="price-card"><div className="price-card-header"><h4 className="price-card-title">{item.name}</h4><div className="price-card-price">{item.price} ₽</div></div><div className="price-card-details"><div className="price-card-detail"><span className="detail-label">Материал:</span><span className="detail-value">{item.material}</span></div><div className="price-card-detail"><span className="detail-label">Вес:</span><span className="detail-value">{item.weight} г</span></div></div><div className="price-card-action"><button className="btn btn-sm btn-outline-primary" onClick={() => openOrderModal(item.name, item.priceNum)}>Заказать</button></div></div>))}</div>
          </div>
        </section>

        {/* Форма оформления заказа */}
        <section id="order" className="py-5" style={{ backgroundColor: '#1b1919' }}>
          <div className="container">
            <h2 className="section-title text-center mb-5">Оформление заказа</h2>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="form-container">
                  <form onSubmit={handleOrder}>
                    <div className="row">
                      <div className="col-md-6 mb-3"><label className="form-label">Ваше имя *</label><input type="text" className="form-control" name="name" defaultValue={user ? `${user.firstName} ${user.lastName}` : ''} required /></div>
                      <div className="col-md-6 mb-3"><label className="form-label">Телефон *</label><input type="tel" className="form-control" name="phone" placeholder="+7 (___) ___-__-__" onInput={handlePhoneInput} required /></div>
                    </div>
                    <div className="mb-3"><label className="form-label">Email</label><input type="email" className="form-control" name="email" defaultValue={user?.email || ''} /></div>
                    <div className="mb-3"><label className="form-label">Выберите изделие *</label><select className="form-select" name="product" required><option value="">Выберите из списка</option><option value="Кольцо с бриллиантом">Кольцо с бриллиантом - 85 600 ₽</option><option value="Серьги из серебра">Серьги из серебра - 12 300 ₽</option><option value="Золотая цепочка">Золотая цепочка - 45 800 ₽</option><option value="Кулон с изумрудом">Кулон с изумрудом - 124 500 ₽</option><option value="Другое">Другое (описать в пожеланиях)</option></select></div>
                    <div className="mb-3"><label className="form-label">Размер (если требуется)</label><input type="text" className="form-control" placeholder="Например: 17.5" /></div>
                    {/* Доп. услуги */}
                    <div className="checkbox-group"><h6>Дополнительные услуги:</h6><div className="row"><div className="col-md-6"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" id="engraving" /><label className="form-check-label" htmlFor="engraving">Гравировка (500 ₽)</label></div><div className="form-check mb-2"><input className="form-check-input" type="checkbox" id="giftBox" /><label className="form-check-label" htmlFor="giftBox">Подарочная упаковка (300 ₽)</label></div></div><div className="col-md-6"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" id="certificate" /><label className="form-check-label" htmlFor="certificate">Сертификат подлинности (800 ₽)</label></div><div className="form-check mb-2"><input className="form-check-input" type="checkbox" id="insurance" /><label className="form-check-label" htmlFor="insurance">Страхование (1 200 ₽)</label></div></div></div></div>
                    {/* Способ получения */}
                    <div className="checkbox-group"><h6>Способ получения:</h6><div className="form-check mb-2"><input className="form-check-input" type="radio" name="delivery" id="pickup" defaultChecked /><label className="form-check-label" htmlFor="pickup">Самовывоз (бесплатно)</label></div><div className="form-check mb-2"><input className="form-check-input" type="radio" name="delivery" id="courier" /><label className="form-check-label" htmlFor="courier">Курьерская доставка (500 ₽)</label></div><div className="form-check mb-2"><input className="form-check-input" type="radio" name="delivery" id="post" /><label className="form-check-label" htmlFor="post">Почта России (300 ₽)</label></div></div>
                    {/* Комментарий */}
                    <div className="mb-3"><label className="form-label">Комментарий к заказу (пожелания)</label><textarea className="form-control" name="comment" rows="4" placeholder="Укажите дополнительные пожелания..."></textarea></div>
                    <div className="form-check mb-3"><input className="form-check-input" type="checkbox" required /><label className="form-check-label">Я согласен с <a href="#">политикой конфиденциальности</a> *</label></div>
                    <div className="text-center"><button type="submit" className="btn btn-primary btn-lg">Отправить заказ</button></div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Отзывы с каруселью */}
        <section id="testimonials" className="py-5" style={{ backgroundColor: '#1b1919' }}>
          <div className="container"><h2 className="section-title text-center mb-5">Отзывы клиентов</h2>
            <div id="testimonialCarousel" className="carousel slide" data-bs-ride="carousel"><div className="carousel-inner">{reviews.map((r, i) => (<div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}><div className="testimonial-item text-center"><img src={r.img} alt={r.name} className="testimonial-img" /><h5>{r.name}</h5><div className="testimonial-text">{r.text}</div><div className="testimonial-date">{r.date}</div></div></div>))}</div>
              <button className="carousel-control-prev" data-bs-target="#testimonialCarousel" data-bs-slide="prev"><span className="carousel-control-prev-icon"></span></button>
              <button className="carousel-control-next" data-bs-target="#testimonialCarousel" data-bs-slide="next"><span className="carousel-control-next-icon"></span></button>
            </div>
          </div>
        </section>

        {/* Контакты и карта */}
        <section id="contacts" className="py-5" style={{ backgroundColor: '#1b1919' }}>
          <div className="container text-white"><h2 className="section-title text-center mb-5">Контакты</h2>
            <div className="row"><div className="col-lg-6"><ul className="contact-info"><li><i className="fas fa-map-marker-alt"></i><div><strong>Адрес:</strong><br />г. Москва, Краснобогатырская, 2</div></li><li><i className="fas fa-phone"></i><div><strong>Телефон:</strong><br /><a href="tel:+74951234567">+7 (495) 123-45-67</a></div></li><li><i className="fas fa-envelope"></i><div><strong>Email:</strong><br /><a href="mailto:info@edo.ru">info@edo.ru</a></div></li></ul></div><div className="col-lg-6"><div className="map-container"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2241.69!2d37.68!3d55.81!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTXCsDQ4JzU3LjIiTiAzN8KwNDEnMTYuOCJF!5e0!3m2!1sru!2sru!4v1" width="100%" height="300" style={{ border: 0 }}></iframe></div></div></div></div>
        </section>
      </main>

      {/* Футер */}
      <footer><div className="container"><div className="row"><div className="col-lg-4 mb-4"><h4>ЭДО</h4><p>Ювелирный магазин премиум-класса.</p></div><div className="col-lg-4 mb-4"><h5>Ссылки</h5><ul className="footer-links"><li><a href="#catalog">Каталог</a></li><li><a href="#prices">Прайс</a></li></ul></div><div className="col-lg-4 mb-4"><h5>Контакты</h5><p>+7 (495) 123-45-67</p></div></div><div className="copyright text-center"><p>© 2024 ЭДО</p></div></div></footer>

      {/* Модальное окно: Заказать звонок */}
      {showCallModal && <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.8)' }}><div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">Заказать звонок</h5><button className="btn-close" onClick={() => setShowCallModal(false)}></button></div><div className="modal-body" style={{ background: '#1b1919' }}><form onSubmit={handleCallOrder}><div className="mb-3"><label className="form-label">Имя *</label><input className="form-control" name="name" defaultValue={user?.firstName || ''} required /></div><div className="mb-3"><label className="form-label">Телефон *</label><input className="form-control" name="phone" placeholder="+7 (___) ___-__-__" onInput={handlePhoneInput} required /></div><div className="mb-3"><label className="form-label">Комментарий</label><textarea className="form-control" name="comment" rows="3" placeholder="Укажите тему обращения..."></textarea></div><button type="submit" className="btn btn-primary w-100">Заказать звонок</button></form></div></div></div></div>}

      {/* Модальное окно: Вход */}
      {showLoginModal && <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.8)' }}><div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">Вход</h5><button className="btn-close" onClick={() => setShowLoginModal(false)}></button></div><div className="modal-body" style={{ background: '#1b1919' }}><form onSubmit={handleLogin}><div className="mb-3"><label className="form-label">Email *</label><input className="form-control" name="email" required /></div><div className="mb-3"><label className="form-label">Пароль *</label><input type="password" className="form-control" name="password" required /></div><button type="submit" className="btn btn-primary w-100">Войти</button></form><p className="text-center mt-3">Нет аккаунта? <a href="#" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>Регистрация</a></p></div></div></div></div>}

      {/* Модальное окно: Регистрация */}
      {showRegisterModal && <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.8)' }}><div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">Регистрация</h5><button className="btn-close" onClick={() => setShowRegisterModal(false)}></button></div><div className="modal-body" style={{ background: '#1b1919' }}><form onSubmit={handleRegister}><div className="row"><div className="col-md-6 mb-3"><label className="form-label">Имя *</label><input className="form-control" name="first_name" required /></div><div className="col-md-6 mb-3"><label className="form-label">Фамилия *</label><input className="form-control" name="last_name" required /></div></div><div className="mb-3"><label className="form-label">Телефон *</label><input className="form-control" name="phone" placeholder="+7 (___) ___-__-__" onInput={handlePhoneInput} required /></div><div className="mb-3"><label className="form-label">Email *</label><input className="form-control" name="email" required /></div><div className="mb-3"><label className="form-label">Пароль *</label><input type="password" className="form-control" name="password" required /></div><div className="mb-3"><label className="form-label">Подтверждение *</label><input type="password" className="form-control" name="password_confirm" required /></div><div className="form-check mb-3"><input className="form-check-input" type="checkbox" required /><label className="form-check-label">Я согласен с <a href="#">политикой конфиденциальности</a> *</label></div><button type="submit" className="btn btn-primary w-100">Зарегистрироваться</button></form></div></div></div></div>}

      {/* Модальное окно: Быстрый заказ товара */}
      {showOrderModal && <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.8)' }}><div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">Заказ товара</h5><button className="btn-close" onClick={() => setShowOrderModal(false)}></button></div><div className="modal-body" style={{ background: '#1b1919' }}><div className="mb-3"><label className="form-label">Товар</label><input className="form-control" value={selectedProduct.name} readOnly /></div><div className="mb-3"><label className="form-label">Цена</label><input className="form-control" value={`${selectedProduct.price} ₽`} readOnly /></div>{user && <div className="mb-3"><label className="form-label">Заказчик</label><input className="form-control" value={`${user.firstName} ${user.lastName}`} readOnly /></div>}<button className="btn btn-primary w-100" onClick={() => handleQuickOrder(selectedProduct.name, selectedProduct.price)}>Оформить заказ</button></div></div></div></div>}
    </>
  );
}