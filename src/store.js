const fs = require("node:fs");
const path = require("node:path");

// На Railway можно подключить Volume в /data и задать DATA_DIR=/data.
// Локально данные по умолчанию остаются в src/data.json.
const DATA_DIR = process.env.DATA_DIR || __dirname;
fs.mkdirSync(DATA_DIR, { recursive: true });
const FILE = path.join(DATA_DIR, "data.json");
let data = {};
try {
  if (fs.existsSync(FILE)) data = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch (e) {
  console.error("Не удалось прочитать хранилище:", e.message);
}
function guildData(guildId) {
  if (!guildId) throw new Error("Не удалось определить Discord-сервер.");
  if (!data[guildId]) {
    data[guildId] = {
      voiceLobbyId: null,
      ticketCategoryId: null,
      logChannelId: null,
      welcomeChannelId: null,
      welcomeText: "Добро пожаловать, {user}, на Rust-сервер!"
    };
  }
  return data[guildId];
}
function save() {
  const temp = `${FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(temp, FILE);
}
module.exports = { guildData, save };
