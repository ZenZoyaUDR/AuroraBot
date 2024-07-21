/**
 * Self note: i have spent like 14 hours just to migrate
 * this code to ESM6 (no joke)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modulesDir = path.join(__dirname, "../modules/");
let modules = [];

async function init(bot) {
  await reload(bot);
  modules.forEach((inject) => {
    inject(bot);
  });
}

async function reload(bot) {
  // Clear previous modules from the modules array
  modules = [];

  const files = fs.readdirSync(modulesDir);
  for (const file of files) {
    if (!file.endsWith(".js")) {
      bot.logger.warn(`Invalid module file: ${file}`);
      continue;
    }
    const modulePath = pathToFileURL(path.join(modulesDir, file)).href;
    try {
      // Import the module fresh
      const { inject } = await import(modulePath + `?t=${Date.now()}`);
      if (typeof inject === "function") {
        modules.push(inject);
      } else {
        bot.logger.error(`Inject was not a function: ${file}`);
      }
    } catch (error) {
      bot.logger.error(`Failed to import module ${file}: ${error}`);
    }
  }
}

export { init, modules as plugins, reload };

/* Old code?
import fs from "fs";
import path from "path";

const modulesDir = path.join("./src/minecraft/modules/");
var plugins = [];

function init(bot) {
  reload(bot);
  plugins.forEach((inject) => {
    // inject the plugin??
    inject(bot);
  });
}

function reload(bot) {
  if (plugins.length > 0) {
    let pfiles = Object.keys(require.cache).filter((r) =>
      r.startsWith(path.resolve(modulesDir))
    );
    pfiles.forEach((f) => {
      delete require.cache[f];
    });
    plugins = [];
  }
  fs.readdirSync(modulesDir).forEach((plugin) => {
    if (!plugin.endsWith(".js"))
      returnbot.logger.warn(`Invalid plugin file: ${plugin}`);
    let inject = import(`${modulesDir}${plugin}`).inject;
    if (typeof inject === "function") {
      plugins.push(inject);
    } else {
      bot.logger.error(`Inject was not a function: ${plugin}`);
    }
  });
}

export { init, plugins, reload };
*/
