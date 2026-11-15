require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const admin = PermissionFlagsBits.Administrator;
const commands = [
  new SlashCommandBuilder().setName("setup").setDescription("Создать структуру Rust • Русский").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("setup-info").setDescription("Показать состав шаблона").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("settings").setDescription("Панель настройки Server Builder").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("ticket-panel").setDescription("Опубликовать панель тикетов").setDefaultMemberPermissions(admin),
  new SlashCommandBuilder().setName("bot-invite").setDescription("Создать ссылку приглашения другого Discord-бота").setDefaultMemberPermissions(admin)
    .addStringOption(o => o.setName("application_id").setDescription("Application ID приглашаемого бота").setRequired(true))
    .addStringOption(o => o.setName("permissions").setDescription("Числовая маска прав (по умолчанию минимальные)").setRequired(false)),
  new SlashCommandBuilder().setName("ban").setDescription("Заблокировать участника").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("member").setDescription("Кого заблокировать").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Причина").setRequired(false)),
  new SlashCommandBuilder().setName("kick").setDescription("Исключить участника").setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName("member").setDescription("Кого исключить").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Причина").setRequired(false)),
  new SlashCommandBuilder().setName("mute").setDescription("Выдать тайм-аут участнику").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("member").setDescription("Кого ограничить").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Длительность от 1 до 40320 минут").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Причина").setRequired(false)),
  new SlashCommandBuilder().setName("warn").setDescription("Выдать предупреждение").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("member").setDescription("Кому выдать предупреждение").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Причина").setRequired(true)),
  new SlashCommandBuilder().setName("clear").setDescription("Удалить последние сообщения").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName("amount").setDescription("От 1 до 100").setMinValue(1).setMaxValue(100).setRequired(true)),
  new SlashCommandBuilder().setName("voice-setup").setDescription("Назначить текущий голосовой канал комнатой создания").setDefaultMemberPermissions(admin)
].map(c => c.toJSON());

async function main() {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) throw new Error("Заполните DISCORD_TOKEN, CLIENT_ID и GUILD_ID в .env");
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log("Команды Server Builder 2.0 зарегистрированы.");
}
main().catch(e => { console.error(e); process.exit(1); });
