import crypto from "crypto";
import * as discord from "../discord.js"; // Ensure the path and file extension are correct

let trustHash = "";
let fullAccessHash = "";

function generateHash(key, divisor, length) {
  return crypto
    .createHash("sha256")
    .update(Math.floor(Date.now() / divisor) + key)
    .digest("hex")
    .substring(0, length);
}

function sendHashToDiscord(bot, channelID, hash) {
  const sendMessage = () => {
    const channel = discord._client.channels.cache.get(channelID);
    if (channel) {
      const embed = {
        title: "New Hash Generated",
        description: `Generated at ${new Date().toLocaleString()}`,
        color: 0x9d0aff, // Purple-ish
        fields: [
          {
            name: "Hash",
            value: hash,
            inline: true,
          },
        ],
      };
      channel.send({ embeds: [embed] });
      bot.logger.debug(`Hash sent to Discord channel ${channelID}`);
    } else {
      bot.logger.warn(`Channel ${channelID} not found.`);
    }
  };

  if (bot.config.discord.enable) {
    if (discord._client.readyAt) {
      sendMessage();
    } else {
      discord._client.once("ready", sendMessage);
    }
  }
}

function generateAndSendHash(bot, key, divisor, length, channelID) {
  const hash = generateHash(key, divisor, length);
  bot.logger.info(`Generated HASH: ${hash}`);
  sendHashToDiscord(bot, channelID, hash);
  return hash;
}

function genTrustHash(bot) {
  return generateAndSendHash(
    bot,
    bot.config.encryptionKey.trustedKey,
    69907,
    8,
    bot.config.discord.trustedHashChannel
  );
}

function genFullAccessHash(bot) {
  return generateAndSendHash(
    bot,
    bot.config.encryptionKey.fullAccessKey,
    6907,
    12,
    bot.config.discord.fullAccessHashChannel
  );
}

function genHash(type, bot) {
  switch (type) {
    case "all":
      if (!trustHash) trustHash = genTrustHash(bot);
      if (!fullAccessHash) fullAccessHash = genFullAccessHash(bot);
      break;
    case "trust":
      trustHash = genTrustHash(bot);
      break;
    case "full":
      fullAccessHash = genFullAccessHash(bot);
      break;
  }
}

function hashCheck(type, hash) {
  if (type === "trust") return trustHash === hash;
  if (type === "full") return fullAccessHash === hash;
  return false;
}

export { genHash, hashCheck };
