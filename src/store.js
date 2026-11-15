const fs = require("node:fs");
const path = require("node:path");
const FILE = path.join(__dirname, "data.json");
let data = {};
try { if (fs.existsSync(FILE)) data = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { console.error("Не удалось прочитать data.json:", e.message); }
function guildData(guildId) {
  if (!data[guildId]) data[guildId] = { voiceLobbyId: null, ticketCategoryId: null, logChannelId: null, welcomeChannelId: null, welcomeText: "Добро пожаловать, {user}, на Rust-сервер!" };
  return data[guildId];
}
function save() { fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8"); }
module.exports = { guildData, save };
