# Server Builder 2.0 — Rust RU (multi-server)

Публичный Discord-бот для нескольких серверов. `GUILD_ID` больше не нужен: сервер определяется автоматически из `interaction.guildId`, а настройки хранятся отдельно по ID каждого сервера.

## Переменные окружения

Обязательны только:
- `DISCORD_TOKEN` — токен бота.
- `CLIENT_ID` — Application ID приложения Discord.

`DATA_DIR` необязателен. Для постоянного хранения на Railway подключите Volume к `/data` и задайте `DATA_DIR=/data`.

## Публикация slash-команд

После изменения команд выполните один раз:
```bash
npm install
npm run deploy
```
Скрипт регистрирует **глобальные** команды через Discord API. Их появление может занять некоторое время. Повторно указывать `GUILD_ID` не нужно.

## Запуск
```bash
npm start
```

На Railway:
1. Загрузите этот проект в GitHub без `.env`, `node_modules` и `src/data.json`.
2. Создайте сервис из GitHub-репозитория.
3. В Variables добавьте `DISCORD_TOKEN` и `CLIENT_ID`.
4. В настройках сервиса используйте Start Command `npm start`.
5. Для сохранения настроек серверов между пересборками добавьте Railway Volume с Mount Path `/data` и переменную `DATA_DIR=/data`.
6. Глобальные команды зарегистрируйте один раз локально командой `npm run deploy` с теми же `DISCORD_TOKEN` и `CLIENT_ID`, либо выполните команду в отдельной среде запуска Railway.

## Приглашение бота

В Discord Developer Portal → OAuth2 → URL Generator выберите:
- Scopes: `bot`, `applications.commands`
- Bot permissions: Manage Channels, Manage Roles, View Channels, Send Messages, Read Message History, Move Members, Connect, Manage Messages, Moderate Members, Kick Members, Ban Members.

Скопируйте сгенерированную ссылку и разместите её публично. Любой пользователь сможет пригласить бота, но Discord потребует подтверждение от администратора сервера.

## Команды

- `/setup` — создать структуру Rust.
- `/setup-info` — описание шаблона.
- `/settings` — настройки.
- `/ticket-panel` — опубликовать тикеты.
- `/voice-setup` — настроить лобби временных комнат.
- `/bot-invite` — создать ссылку приглашения другого бота.
- `/ban`, `/kick`, `/mute`, `/warn`, `/clear` — модерация.

## Важное

- Бот может работать на многих серверах одновременно; настройки разделяются по Discord Guild ID.
- Команды доступны на серверах, куда добавлен бот. Команды модерации и настройки защищены правами Discord.
- Для приветствий требуется включить **Server Members Intent** в Developer Portal; в коде intent уже включён.
- Никогда не публикуйте `.env` и не отправляйте токен в чат. Если токен попал в архив/репозиторий или был кому-то показан, сбросьте его в Developer Portal.
- Локальное хранилище `data.json` подходит для тестирования. Для Railway используйте Volume, иначе данные могут потеряться при пересоздании контейнера.
