# WhatsApp чат через GREEN-API

Минимальный React интерфейс для текстовых сообщений WhatsApp. Пользователь вводит `idInstance` и `apiTokenInstance`, создает чат по номеру телефона, отправляет сообщение и получает ответ через очередь уведомлений HTTP API. Визуальный стиль основан на [whatsapp.com](https://www.whatsapp.com/).

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`. Для проверки типов: `npm run typecheck`. Для запуска собранной версии: `npm run build && npm start`.

Перед использованием авторизуйте **WhatsApp** инстанс в GREEN-API. В его настройках включите `Receive webhooks on incoming messages and files` и оставьте `webhookUrl` пустым для получения через HTTP API. Если `apiUrl` инстанса отличается от `https://api.green-api.com`, укажите его в дополнительных настройках формы входа.

## Публикация

Фронтенд публикуется на GitHub Pages по адресу `https://elena-front.github.io/test-frontend-green-api/`. Workflow `.github/workflows/pages.yml` собирает его с нужным базовым путём и адресом API `https://test-frontend-green-api.onrender.com`. В настройках репозитория GitHub откройте **Settings → Pages** и выберите **GitHub Actions** как источник публикации. После отправки изменений в ветку `main` дождитесь выполнения workflow в разделе **Actions**.

Сервер `server.ts` должен быть развернут отдельно на Render по указанному адресу. Для Web Service используйте Node.js 24, команду сборки `npm ci --include=dev && npm run build`, команду запуска `npm start` и переменную окружения `HOST=0.0.0.0`. Опубликуйте текущие изменения сервера: в нём разрешён CORS для домена GitHub Pages. Если Render уже подключен к репозиторию, проверьте, что новая версия успешно развернулась. Локально запросы по-прежнему идут на тот же адрес, с которого открыт интерфейс.

Сервер передает запросы к GREEN-API, чтобы интерфейс не зависел от браузерных ограничений CORS. Учетные данные не записываются на сервер и не сохраняются в браузерном хранилище; локально сохраняются только чаты и сообщения. Уведомления читаются методом `ReceiveNotification` и подтверждаются `DeleteNotification` после сохранения сообщения в браузере. Открывайте один экземпляр чата для данного инстанса: очередь уведомлений общая для всех потребителей.

## Методы API

- `GetStateInstance` — проверка подключения.
- `CheckWhatsapp` — проверка номера и получение WhatsApp `chatId` (в том числе `@lid`).
- `SendMessage` — отправка текста.
- `ReceiveNotification` и `DeleteNotification` — получение и подтверждение уведомлений.

Документация: [WhatsApp SendMessage](https://green-api.com/docs/api/sending/SendMessage/), [получение уведомлений](https://green-api.com/docs/api/receiving/technology-http-api/), [CheckWhatsapp](https://green-api.com/docs/api/service/CheckWhatsapp/).

## Структура проекта

- `src/components/` — экран подключения, список чатов, переписка и окно нового чата; рядом с каждым компонентом расположен его CSS Module.
- `src/hooks/useChat.ts` — состояние чатов, отправка и опрос входящих уведомлений.
- `src/lib/` — запросы к локальному API и функции работы с чатами.
- `src/types.ts` — общие типы клиента; `server.ts` — TypeScript прокси к GREEN-API.
- `src/styles/Shared.module.css` и `src/App.module.css` — общие элементы и каркас приложения.
