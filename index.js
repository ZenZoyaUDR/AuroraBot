import figlet from "figlet";
import fs from "fs";
import gradient from "gradient-string";
import js_yaml from "js-yaml";
import { createSpinner } from "nanospinner";
import path from "path";
import { createBots } from "./src/minecraft/index.js";
import loggerModule from "./src/util/logger.js";
const logger = loggerModule({ logLevel: 1 });

async function printAsciiArt() {
  return new Promise((resolve, reject) => {
    figlet.text(
      "Aurora",
      {
        font: "ANSI Shadow",
        width: 90,
        whitespaceBreak: true,
      },
      (err, data) => {
        if (err) {
          logger.error("Error generating text with figlet:", err);
          return reject(err);
        }
        console.info(gradient("#9f0fff", "#db69ff", "#ffaaff").multiline(data));
        resolve();
      }
    );
  });
}

async function initialize() {
  console.clear();

  try {
    await printAsciiArt();
  } catch (err) {
    logger.error("Failed to print ASCII art:", err);
    return;
  }

  const configPath = path.join("./config.yml");
  const defaultConfigPath = path.join("./src/data/default_config.yml");

  try {
    fs.accessSync(configPath);
  } catch (err) {
    logger.warn("Config not found, creating config from the default config");
    try {
      fs.copyFileSync(defaultConfigPath, configPath);
      logger.success("Default config copied successfully");
    } catch (copyErr) {
      logger.error(`Failed to copy default config: ${copyErr.message}`);
    }
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf8");
    const config = js_yaml.load(configContent);
    logger.success("Configuration loaded successfully");

    const spinner = createSpinner("Creating bot")
      .start({
        color: "magenta",
      })
      .update({
        frames: ["🌕︎", "🌖︎", "🌗︎", "🌘︎", "🌑︎", "🌘︎", "🌗︎", "🌖︎", "🌕︎"],
        interval: 100,
      });
    await createBots(config.minecraft.servers, spinner);
    spinner.success({
      text: "Successfully created and connecting all bots",
      mark: "✔ ",
    });
  } catch (err) {
    logger.error("Error loading configuration:", err.stack);
  }

  process.on("uncaughtException", (err) => {
    logger.error("[Uncaught exception]", err.stack);
  });

  process.on("unhandledRejection", (err) => {
    logger.error("[Unhandled rejection]", err.stack);
  });
}

initialize().catch((err) => {
  logger.error("Initialization failed:", err);
});
