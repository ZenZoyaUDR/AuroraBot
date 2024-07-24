import fs from "fs";
import js_yaml from "js-yaml";
import path from "path";
import { Tellraw, Text } from "../util/tellraw.js";
import { createBot } from "./bot.js";

// Load the configuration
const configPath = path.join("./config.yml");
const config = js_yaml.load(fs.readFileSync(configPath));

const bots = {};
const clientBots = [];

function generateRandomString(length) {
  const characters = "¤⯍@#$%^&*+-=?";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}

function createBots(servers, spinner) {
  const promises = servers.map((server, index) =>
    handleServer(server, spinner, index, servers.length)
  );
  return Promise.all(promises);
}

function handleServer(server, spinner, index, total) {
  return new Promise((resolve) => {
    const bot = createBotInstance(server);
    setupBotHandlers(bot, server, resolve, spinner, index, total);
  });
}

// Function to create a bot instance
function createBotInstance(server) {
  const bot = createBot({
    host: server.host,
    port: server.port,
    username: `${config.minecraft.username}§${generateRandomString(
      1
    )}§${generateRandomString(1)}§${generateRandomString(1)}`,
    version: server.version,
    hideErrors: config.minecraft.hideErrors,
    brand: "vanilla",
    logErrors: config.logErrors,
  });

  bots[`${server.host}:${server.port}`] = bot;
  clientBots.push(bot);
  return bot;
}

function setupBotHandlers(bot, server, resolve, spinner, index, total) {
  bot.once("end", (reason) => handleBotEnd(bot, server, reason));
  bot._client.on("login", () =>
    handleBotLogin(bot, server, resolve, spinner, index, total)
  );
}

// Function to handle bot end event
function handleBotEnd(bot, server, reason) {
  let timeout = 1000;
  if (
    reason.extra?.find(
      (data) => data.text === "Wait 5 seconds before connecting, thanks! :)"
    )
  ) {
    timeout = 6000;
  }

  delete bots[`${server.host}:${server.port}`];
  const cliBotsIndex = clientBots.indexOf(bot);
  if (cliBotsIndex !== -1) {
    clientBots.splice(cliBotsIndex, 1);
  }

  bot.logger.debug(reason.extra);
  setTimeout(() => {
    bot.end();
    handleServer(server);
  }, timeout);
}

function handleBotLogin(bot, server, resolve, spinner, index, total) {
  spinner.update({
    text: `Creating bot ${bot._client.username} successfully logged in on: ${
      server.host
    }:${server.port} (${index + 1}/${total})`,
  });

  const commands = ["op @s[type=player]", "god on", "cspy on", "vanish on"];
  commands.forEach((command) => {
    setTimeout(() => {
      bot.chat("command", command);
    }, 300 * commands.indexOf(command));
  });

  setTimeout(() => {
    bot.core.refill();
    setTimeout(() => {
      sendJoinMessage(bot);
      resolve(); // Resolve the promise when the bot is fully set up
    }, 500);
  }, 1000);
}

// Function to send join message
function sendJoinMessage(bot) {
  const joinmsg = new Tellraw()
    .add(new Text(bot.convertFont(" By ")).setColor(bot.colorPalette.FOURTHARY))
    .add(new Text(bot.convertFont("Z")).setColor("#63EF83"))
    .add(new Text(bot.convertFont("e")).setColor("#67F1A2"))
    .add(new Text(bot.convertFont("n")).setColor("#6BF3C0"))
    .add(new Text(bot.convertFont("Z")).setColor("#6FF5DF"))
    .add(new Text(bot.convertFont("o")).setColor("#75E6E4"))
    .add(new Text(bot.convertFont("y")).setColor("#7BD6EA"))
    .add(new Text(bot.convertFont("a")).setColor("#81C7EF"));
  bot.fancymsg(joinmsg.get());
}

export { bots, clientBots, createBots };
