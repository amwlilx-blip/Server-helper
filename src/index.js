require("dotenv").config();
const {
  Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, OAuth2Scopes
} = require("discord.js");
const { RUST_RU } = require("./config");
const { guildData, save } = require("./store");

const { DISCORD_TOKEN, GUILD_ID, CLIENT_ID } = process.env;
if (!DISCORD_TOKEN) throw new Error("Не задан DISCORD_TOKEN в .env");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers] });
const creatingRooms = new Set();

const isAdmin = i => i.memberPermissions?.has(PermissionFlagsBits.Administrator);
const safeReply = (i, content) => i.reply({ content, ephemeral: true });

async function setupGuild(guild) {
  const me = guild.members.me;
  if (!me.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ViewChannel])) {
    throw new Error("Боту нужны Manage Channels, Manage Roles и View Channels.");
  }
  const result = { roles: 0, categories: 0, text: 0, voice: 0, skipped: 0 };
  for (const spec of RUST_RU.roles) {
    if (guild.roles.cache.some(r => r.name === spec.name)) { result.skipped++; continue; }
    await guild.roles.create({ name: spec.name, colors: { primaryColor: spec.color }, permissions: spec.permissions, reason: "Server Builder 2.0 setup" });
    result.roles++;
  }
  await guild.roles.fetch();
  const everyone = guild.roles.everyone;
  const staff = guild.roles.cache.find(r => r.name === "🛡️ Администратор");
  for (const spec of RUST_RU.categories) {
    let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === spec.name);
    if (!cat) {
      const overwrites = spec.staffOnly ? [
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...(staff ? [{ id: staff.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : [])
      ] : [];
      cat = await guild.channels.create({ name: spec.name, type: ChannelType.GuildCategory, permissionOverwrites: overwrites });
      result.categories++;
    }
    for (const ch of spec.channels || []) {
      if (guild.channels.cache.some(c => c.name === ch.name)) { result.skipped++; continue; }
      await guild.channels.create({ name: ch.name, type: ChannelType.GuildText, topic: ch.topic, parent: cat.id });
      result.text++;
    }
    for (const name of spec.voice || []) {
      if (guild.channels.cache.some(c => c.name === name)) { result.skipped++; continue; }
      const voice = await guild.channels.create({ name, type: ChannelType.GuildVoice, parent: cat.id });
      if (name.startsWith("➕")) { guildData(guild.id).voiceLobbyId = voice.id; save(); }
      result.voice++;
    }
  }
  const ticketCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === "🎫・ПОДДЕРЖКА");
  if (ticketCat) { guildData(guild.id).ticketCategoryId = ticketCat.id; save(); }
  return result;
}

function settingsEmbed() {
  return new EmbedBuilder().setColor(0xD35400).setTitle("⚙️ Server Builder — настройки")
    .setDescription("Выберите функцию. Настройки применяются только после вашего действия.")
    .addFields(
      { name: "🎫 Тикеты", value: "Опубликовать панель тикетов", inline: true },
      { name: "🎙️ Голосовые", value: "Назначить канал создания комнат", inline: true },
      { name: "🤖 Другие боты", value: "Сформировать OAuth2-ссылку приглашения", inline: true },
      { name: "👋 Приветствие", value: "Настроить канал и текст приветствия", inline: true },
      { name: "🧾 Логи", value: "Назначить канал журнала модерации", inline: true },
      { name: "📚 Каналы", value: "Менять темы/описания через настройки каналов Discord", inline: true }
    );
}
function settingsRow() {
  return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("sb_settings")
    .setPlaceholder("Выберите настройку…").addOptions(
      { label: "Опубликовать панель тикетов", value: "ticket", emoji: "🎫" },
      { label: "Назначить текущий голосовой канал лобби", value: "voice", emoji: "🎙️" },
      { label: "Ссылка приглашения другого бота", value: "invite", emoji: "🤖" },
      { label: "Настроить приветствие", value: "welcome", emoji: "👋" },
      { label: "Назначить канал логов", value: "logs", emoji: "🧾" }
    ));
}

async function publishTicketPanel(channel) {
  const embed = new EmbedBuilder().setColor(0xD35400).setTitle("🎫 Поддержка Rust")
    .setDescription("Нужна помощь? Нажмите кнопку ниже, чтобы открыть приватный тикет.\nВыберите категорию обращения после создания.");
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("sb_ticket").setLabel("Создать тикет").setEmoji("🎫").setStyle(ButtonStyle.Primary)
  );
  await channel.send({ embeds: [embed], components: [row] });
}

client.once(Events.ClientReady, c => console.log(`Запущен как ${c.user.tag}`));

client.on(Events.InteractionCreate, async i => {
  try {
    if (i.isChatInputCommand()) {
      if (GUILD_ID && i.guildId !== GUILD_ID) return safeReply(i, "Этот бот настроен для другого сервера.");
      const name = i.commandName;
      if (name === "setup-info") return i.reply({ embeds: [new EmbedBuilder().setColor(0xD35400).setTitle("Rust • RU").setDescription("Категории Rust, роли, тикеты, временные голосовые комнаты и модерация.")], ephemeral: true });
      if (name === "setup") {
        if (!isAdmin(i)) return safeReply(i, "Команда доступна администраторам.");
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("sb_setup_yes").setLabel("Создать структуру").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("sb_setup_no").setLabel("Отмена").setStyle(ButtonStyle.Secondary)
        );
        return i.reply({ content: "Создать недостающие категории, каналы и роли Rust? Существующие элементы не удаляются.", components: [row], ephemeral: true });
      }
      if (name === "settings") {
        if (!isAdmin(i)) return safeReply(i, "Настройки доступны администраторам.");
        return i.reply({ embeds: [settingsEmbed()], components: [settingsRow()], ephemeral: true });
      }
      if (name === "ticket-panel") {
        if (!isAdmin(i)) return safeReply(i, "Недостаточно прав.");
        await publishTicketPanel(i.channel);
        return safeReply(i, "Панель тикетов опубликована в этом канале.");
      }
      if (name === "voice-setup") {
        if (!isAdmin(i)) return safeReply(i, "Недостаточно прав.");
        if (!i.member.voice.channel) return safeReply(i, "Сначала зайдите в голосовой канал, который хотите назначить лобби.");
        guildData(i.guildId).voiceLobbyId = i.member.voice.channel.id; save();
        return safeReply(i, `Канал ${i.member.voice.channel} назначен лобби создания комнат.`);
      }
      if (name === "bot-invite") {
        if (!isAdmin(i)) return safeReply(i, "Недостаточно прав.");
        const appId = i.options.getString("application_id");
        if (!/^\d{17,20}$/.test(appId)) return safeReply(i, "Application ID должен содержать только 17–20 цифр.");
        const perms = i.options.getString("permissions") || "0";
        if (!/^\d+$/.test(perms)) return safeReply(i, "Маска permissions должна быть числом.");
        const url = `https://discord.com/oauth2/authorize?client_id=${appId}&scope=${OAuth2Scopes.Bot}%20${OAuth2Scopes.ApplicationsCommands}&permissions=${perms}`;
        return safeReply(i, `Ссылка приглашения (проверьте разрешения перед авторизацией):\n${url}\n\nПриглашение должен подтвердить администратор сервера.`);
      }
      if (["ban", "kick", "mute", "warn"].includes(name)) {
        const target = i.options.getUser("member");
        const reason = i.options.getString("reason") || `Действие модератора ${i.user.tag}`;
        const member = await i.guild.members.fetch(target.id);
        if (target.id === i.user.id || target.id === client.user.id) return safeReply(i, "Нельзя применить это действие к себе или боту.");
        if (name === "ban") await member.ban({ reason });
        if (name === "kick") await member.kick(reason);
        if (name === "mute") await member.timeout(i.options.getInteger("minutes") * 60_000, reason);
        const logId = guildData(i.guildId).logChannelId;
        const log = logId ? i.guild.channels.cache.get(logId) : null;
        if (log?.isTextBased()) await log.send(`🛡️ **${name.toUpperCase()}** • ${target.tag}\nМодератор: ${i.user.tag}\nПричина: ${reason}`);
        return safeReply(i, name === "warn" ? `⚠️ Предупреждение для ${target.tag}: ${reason}` : `Готово: ${target.tag}.`);
      }
      if (name === "clear") {
        const amount = i.options.getInteger("amount");
        const deleted = await i.channel.bulkDelete(amount, true);
        return safeReply(i, `Удалено сообщений: ${deleted.size}. Сообщения старше 14 дней Discord не позволяет удалить массово.`);
      }
    }

    if (i.isButton()) {
      if (i.customId === "sb_setup_no") return i.update({ content: "Настройка отменена.", components: [] });
      if (i.customId === "sb_setup_yes") {
        if (!isAdmin(i)) return safeReply(i, "Недостаточно прав.");
        await i.update({ content: "⏳ Создаю структуру…", components: [] });
        const r = await setupGuild(i.guild);
        return i.editReply(`✅ Готово. Роли: ${r.roles}; категории: ${r.categories}; текстовые каналы: ${r.text}; голосовые: ${r.voice}; пропущено: ${r.skipped}.`);
      }
      if (i.customId === "sb_ticket") {
        const gd = guildData(i.guildId);
        const category = gd.ticketCategoryId ? i.guild.channels.cache.get(gd.ticketCategoryId) : null;
        if (!category) return safeReply(i, "Категория тикетов не найдена. Сначала выполните /setup.");
        const existing = i.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.topic === `ticket-owner:${i.user.id}`);
        if (existing) return safeReply(i, `У вас уже есть открытый тикет: ${existing}`);
        const channel = await i.guild.channels.create({
          name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9а-яё-]/gi, "-").slice(0, 90),
          type: ChannelType.GuildText, parent: category.id, topic: `ticket-owner:${i.user.id}`,
          permissionOverwrites: [
            { id: i.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
            ...(i.guild.roles.cache.find(r => r.name === "🛡️ Администратор") ? [{ id: i.guild.roles.cache.find(r => r.name === "🛡️ Администратор").id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : [])
          ]
        });
        const close = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("sb_ticket_close").setLabel("Закрыть тикет").setStyle(ButtonStyle.Danger));
        await channel.send({ content: `${i.user}, опишите ваше обращение. Администрация скоро ответит.`, components: [close] });
        return safeReply(i, `Тикет создан: ${channel}`);
      }
      if (i.customId === "sb_ticket_close") {
        if (!isAdmin(i) && !i.channel.topic?.includes(`ticket-owner:${i.user.id}`)) return safeReply(i, "Закрыть тикет может автор или администратор.");
        await i.reply({ content: "Тикет будет удалён через 5 секунд.", ephemeral: true });
        setTimeout(() => i.channel.delete("Тикет закрыт").catch(() => {}), 5000);
        return;
      }
    }

    if (i.isStringSelectMenu() && i.customId === "sb_settings") {
      if (!isAdmin(i)) return safeReply(i, "Недостаточно прав.");
      const choice = i.values[0], gd = guildData(i.guildId);
      if (choice === "ticket") {
        await publishTicketPanel(i.channel);
        return safeReply(i, "Панель тикетов опубликована в текущем канале.");
      }
      if (choice === "voice") {
        if (!i.member.voice.channel) return safeReply(i, "Сначала зайдите в голосовой канал-лобби, затем повторите выбор.");
        gd.voiceLobbyId = i.member.voice.channel.id; save();
        return safeReply(i, `Лобби установлено: ${i.member.voice.channel.name}`);
      }
      if (choice === "logs") {
        gd.logChannelId = i.channelId; save();
        return safeReply(i, `Канал ${i.channel} назначен каналом логов.`);
      }
      if (choice === "invite") {
        const modal = new ModalBuilder().setCustomId("sb_invite_modal").setTitle("Пригласить другого бота")
          .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("app_id").setLabel("Application ID").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(17).setMaxLength(20)));
        return i.showModal(modal);
      }
      if (choice === "welcome") {
        const modal = new ModalBuilder().setCustomId("sb_welcome_modal").setTitle("Настроить приветствие")
          .addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("channel_id").setLabel("ID текстового канала").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("welcome_text").setLabel("Текст; {user} = упоминание участника").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setValue(gd.welcomeText))
          );
        return i.showModal(modal);
      }
    }

    if (i.isModalSubmit()) {
      if (i.customId === "sb_invite_modal") {
        const appId = i.fields.getTextInputValue("app_id").trim();
        if (!/^\d{17,20}$/.test(appId)) return safeReply(i, "Некорректный Application ID.");
        const url = `https://discord.com/oauth2/authorize?client_id=${appId}&scope=bot%20applications.commands&permissions=0`;
        return safeReply(i, `Ссылка приглашения с минимальными правами:\n${url}\n\nПрава можно выбрать на экране авторизации. Приглашение подтверждает администратор.`);
      }
      if (i.customId === "sb_welcome_modal") {
        const channelId = i.fields.getTextInputValue("channel_id").trim();
        const channel = i.guild.channels.cache.get(channelId);
        if (!channel?.isTextBased()) return safeReply(i, "Не найден текстовый канал с таким ID.");
        const gd = guildData(i.guildId);
        gd.welcomeChannelId = channelId;
        gd.welcomeText = i.fields.getTextInputValue("welcome_text");
        save();
        return safeReply(i, `Приветствие настроено для ${channel}. Используйте {user} для упоминания нового участника.`);
      }
    }
  } catch (e) {
    console.error(e);
    const message = `❌ Ошибка: ${e.message}`;
    if (i.replied || i.deferred) await i.followUp({ content: message, ephemeral: true }).catch(() => {});
    else await i.reply({ content: message, ephemeral: true }).catch(() => {});
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    const gd = guildData(newState.guild.id);
    if (!gd.voiceLobbyId || newState.channelId !== gd.voiceLobbyId || oldState.channelId === newState.channelId) return;
    const key = `${newState.guild.id}:${newState.id}`;
    if (creatingRooms.has(key)) return;
    creatingRooms.add(key);
    const lobby = newState.channel;
    const room = await newState.guild.channels.create({
      name: `🎙️ ${newState.member.displayName}`.slice(0, 95),
      type: ChannelType.GuildVoice,
      parent: lobby.parentId || undefined,
      userLimit: 0,
      permissionOverwrites: [
        { id: newState.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers] }
      ],
      reason: "Временная голосовая комната"
    });
    await newState.setChannel(room).catch(() => {});
    const cleanup = setInterval(async () => {
      const fresh = await newState.guild.channels.fetch(room.id).catch(() => null);
      if (!fresh) return clearInterval(cleanup);
      if (fresh.members.size === 0) {
        clearInterval(cleanup);
        await fresh.delete("Временная комната пуста").catch(() => {});
      }
    }, 15000);
    cleanup.unref?.();
  } catch (e) { console.error("Ошибка временной комнаты:", e); }
  finally { creatingRooms.delete(`${newState.guild.id}:${newState.id}`); }
});

client.on(Events.GuildMemberAdd, async member => {
  const gd = guildData(member.guild.id);
  if (!gd.welcomeChannelId) return;
  const channel = member.guild.channels.cache.get(gd.welcomeChannelId);
  if (channel?.isTextBased()) channel.send(gd.welcomeText.replaceAll("{user}", `${member}`)).catch(() => {});
});

client.login(DISCORD_TOKEN);
