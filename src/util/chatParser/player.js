const mc = require("minecraft-protocol");

const bot = mc.createClient({
  //host: 'chipmunk.land',
  host: "95.216.192.50", //kaboom.pw
  port: 25565,
  username: "catparser",
  version: "1.20.4",
});

bot.on("player_chat", (packet) => {
  console.log(parseMinecraftMessage(packet.unsignedChatContent));
});

const ansiCodes = {
  "§0": "\x1B[30m", // Black
  "§1": "\x1B[34m", // Dark Blue
  "§2": "\x1B[32m", // Dark Green
  "§3": "\x1B[36m", // Dark Aqua
  "§4": "\x1B[31m", // Dark Red
  "§5": "\x1B[35m", // Dark Purple
  "§6": "\x1B[33m", // Gold
  "§7": "\x1B[37m", // Gray
  "§8": "\x1B[90m", // Dark Gray
  "§9": "\x1B[94m", // Blue
  "§a": "\x1B[92m", // Green
  "§b": "\x1B[96m", // Aqua
  "§c": "\x1B[91m", // Red
  "§d": "\x1B[95m", // Light Purple
  "§e": "\x1B[93m", // Yellow
  "§f": "\x1B[97m", // White
  "§l": "\x1B[1m", // Bold
  "§o": "\x1B[3m", // Italic
  "§n": "\x1B[4m", // Underlined
  "§m": "\x1B[9m", // Strikethrough
  "§k": "\x1B[5m", // Obfuscated
  "§r": "\x1B[0m", // Reset
  black: "\x1B[30m", // Black
  dark_blue: "\x1B[34m", // Dark Blue
  dark_green: "\x1B[32m", // Dark Green
  dark_aqua: "\x1B[36m", // Dark Aqua
  dark_red: "\x1B[31m", // Dark Red
  dark_purple: "\x1B[35m", // Dark Purple
  gold: "\x1B[33m", // Gold
  gray: "\x1B[37m", // Gray
  dark_gray: "\x1B[90m", // Dark Gray
  blue: "\x1B[94m", // Blue
  green: "\x1B[92m", // Green
  aqua: "\x1B[96m", // Aqua
  red: "\x1B[91m", // Red
  light_purple: "\x1B[95m", // Light Purple
  yellow: "\x1B[93m", // Yellow
  white: "\x1B[97m", // White
  bold: "\x1B[1m", // Bold
  italic: "\x1B[3m", // Italic
  underlined: "\x1B[4m", // Underlined
  strikethrough: "\x1B[9m", // Strikethrough
  obfuscated: "\x1B[5m", // Obfuscated
  reset: "\x1B[0m", // Reset
};

function parseMinecraftMessage(component) {
  function extractText(comp) {
    let text = "";

    if (comp) {
      let Acomp = Array.isArray(comp) ? comp : [comp];
      Acomp.forEach((item) => {
        if (typeof item === "string") {
          text += item;
        }
      });
    }
    if (comp.text) {
      text += extractText(comp.text);
    }
    if (comp[""]) {
      text += extractText(comp[""]);
    }
    if (comp.extra) {
      let compextra = Array.isArray(comp.extra) ? comp.extra : [comp.extra];
      compextra.forEach((extraComp) => {
        text += extractText(extraComp);
      });
    }
    if (comp.value) {
      let compvalue = Array.isArray(comp.value) ? comp.value : [comp.value];
      compvalue.forEach((valueComp) => {
        text += extractText(valueComp);
      });
    }

    if (comp.color && ansiCodes[comp.color.value]) {
      text = ansiCodes[comp.color.value] + text;
    }
    if (comp.bold && comp.bold.value === 1) {
      text = "\x1b[1m" + text;
    }
    if (comp.italic && comp.italic.value === 1) {
      text = "\x1b[3m" + text;
    }
    if (comp.underlined && comp.underlined.value === 1) {
      text = "\x1b[4m" + text;
    }
    if (comp.obfuscated && comp.obfuscated.value === 1) {
      text = "\x1b[5m" + text;
    }
    if (comp.strikethrough && comp.strikethrough.value === 1) {
      text = "\x1b[9m" + text;
    }
    return text + ansiCodes["reset"];
  }

  let result = "";
  if (component) {
    const mainComponents = Array.isArray(component) ? component : [component];
    mainComponents.forEach((comp) => {
      result += extractText(comp);
    });
  }

  return `Result: ${result}\x1B[0m`; // Ensure to reset colors at the end
}
