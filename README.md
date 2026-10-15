# WhatsApp чат через GREEN-API

Минимальный React интерфейс для текстовых сообщений WhatsApp. Пользователь вводит `idInstance` и `apiTokenInstance`, создает чат по номеру телефона, отправляет сообщение и получает ответ через очередь уведомлений HTTP API. Визуальный стиль основан на [whatsapp.com](https://www.whatsapp.com/).

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`. Для запуска собранной версии: `npm run build && npm start`.

Перед использованием авторизуйте **WhatsApp** инстанс в GREEN-API. В его настройках включите `Receive webhooks on incoming messages and files` и оставьте `webhookUrl` пустым для получения через HTTP API. Если `apiUrl` инстанса отличается от `https://api.green-api.com`, укажите его в дополнительных настройках формы входа.

Сервер передает запросы к GREEN-API, чтобы интерфейс не зависел от браузерных ограничений CORS. Учетные данные не записываются на сервер и не сохраняются в браузерном хранилище; локально сохраняются только чаты и сообщения. Уведомления читаются методом `ReceiveNotification` и подтверждаются `DeleteNotification` после сохранения сообщения в браузере. Открывайте один экземпляр чата для данного инстанса: очередь уведомлений общая для всех потребителей.

## Методы API

- `GetStateInstance` — проверка подключения.
- `CheckWhatsapp` — проверка номера и получение WhatsApp `chatId` (в том числе `@lid`).
- `SendMessage` — отправка текста.
- `ReceiveNotification` и `DeleteNotification` — получение и подтверждение уведомлений.

Документация: [WhatsApp SendMessage](https://green-api.com/docs/api/sending/SendMessage/), [получение уведомлений](https://green-api.com/docs/api/receiving/technology-http-api/), [CheckWhatsapp](https://green-api.com/docs/api/service/CheckWhatsapp/).
