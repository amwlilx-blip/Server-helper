const { ChannelType, PermissionFlagsBits } = require("discord.js");

const RUST_RU = {
  categories: [
    { name: "📌・ИНФОРМАЦИЯ", channels: [
      { name: "👋・приветствие", topic: "Добро пожаловать в Rust-сообщество!" },
      { name: "📜・правила", topic: "Правила сообщества." },
      { name: "📢・объявления", topic: "Новости и объявления администрации." },
      { name: "🗺️・информация-сервера", topic: "IP, режим, вайпы и информация об игровом сервере." }
    ]},
    { name: "💬・ОБЩЕНИЕ", channels: [
      { name: "💬・общий-чат", topic: "Общение участников." },
      { name: "🔎・поиск-команды", topic: "Ищите напарников." },
      { name: "📸・скриншоты-и-клипы", topic: "Делитесь игровыми моментами." },
      { name: "🤝・торговля", topic: "Обмен и торговля." }
    ]},
    { name: "🎮・ИГРА", channels: [
      { name: "⚔️・рейды-и-события", topic: "Рейды и игровые события." },
      { name: "🧰・помощь-по-игре", topic: "Вопросы и помощь по Rust." },
      { name: "🐛・баги-и-жалобы", topic: "Сообщайте о проблемах." }
    ]},
    { name: "🎫・ПОДДЕРЖКА", channels: [
      { name: "🎟️・создать-тикет", topic: "Откройте тикет через кнопку ниже." }
    ]},
    { name: "🔊・ГОЛОСОВЫЕ", voice: ["➕・Создать комнату"] },
    { name: "🛡️・АДМИНИСТРАЦИЯ", staffOnly: true, channels: [
      { name: "🔒・чат-администрации", topic: "Закрытый чат администрации." },
      { name: "📋・модерация", topic: "Журнал действий модерации." },
      { name: "🎫・тикеты", topic: "Закрытые обращения поддержки." }
    ]}
  ],
  roles: [
    { name: "👑 Владелец", color: 0xF1C40F, permissions: [] },
    { name: "🛡️ Администратор", color: 0xE74C3C, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ModerateMembers] },
    { name: "🔨 Модератор", color: 0x3498DB, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ModerateMembers] },
    { name: "💎 VIP", color: 0x9B59B6, permissions: [] },
    { name: "🎮 Игрок", color: 0x2ECC71, permissions: [] },
    { name: "🤖 Бот", color: 0x95A5A5, permissions: [] }
  ]
};
module.exports = { RUST_RU, ChannelType };
