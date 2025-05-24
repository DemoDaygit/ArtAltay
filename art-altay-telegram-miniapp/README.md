# Art Altay - Telegram Mini App

Полнофункциональное Telegram мини-приложение для просмотра, бронирования и покупки мероприятий и экскурсий в Республике Алтай.

## Функциональность

- 🏠 Главный экран с персонализацией
- 📱 Каталог мероприятий с фильтрацией и поиском
- 👤 Личный кабинет с полной статистикой
- 💰 Система покупок и бронирований с интеграцией Telegram Pay
- 🛒 Корзина и избранное
- 🎯 Debug-панель для разработки

## Демо

Вы можете протестировать приложение, перейдя по ссылке: [https://art-altay.vercel.app](https://art-altay.vercel.app)

Или через Telegram бота: [@ArtAltayBot](https://t.me/ArtAltayBot)

## Технологии

- React.js
- Tailwind CSS
- Telegram Web App API
- Axios
- Lucide React

## Установка и запуск

### Предварительные требования

- Node.js (версия 16 или выше)
- npm или yarn

### Установка зависимостей

```bash
npm install
# или
yarn install
```

### Запуск в режиме разработки

```bash
npm start
# или
yarn start
```

### Сборка для production

```bash
npm run build
# или
yarn build
```

## Интеграция с Telegram ботом

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. В настройках бота выберите "Bot Settings" > "Menu Button" > "Web App"
3. Укажите URL вашего развернутого приложения
4. Для локальной разработки можно использовать [ngrok](https://ngrok.com/) для создания туннеля

### Пример настройки через BotFather

```
/mybots
@YourBotName
Bot Settings
Menu Button
Web App
Введите URL вашего приложения (например, https://art-altay.vercel.app)
```

## Структура проекта

```
src/
├── components/       # UI компоненты
├── hooks/            # React хуки
├── services/         # Сервисы для работы с API
├── utils/            # Вспомогательные функции
├── index.js          # Точка входа
└── index.css         # Глобальные стили
```

## Деплой

### Vercel

1. Создайте аккаунт на [Vercel](https://vercel.com/)
2. Подключите ваш GitHub репозиторий
3. Настройте параметры деплоя (фреймворк: React)
4. Нажмите "Deploy"

### GitHub Pages

1. Установите пакет gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Добавьте в package.json:
```json
"homepage": "https://yourusername.github.io/art-altay",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

3. Запустите деплой:
```bash
npm run deploy
```

## Лицензия

MIT

## Контакты

Для вопросов и предложений: [your-email@example.com](mailto:your-email@example.com)
