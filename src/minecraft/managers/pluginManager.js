/**
 * Self note: i have spent like 14 hours just to migrate
 * this code to ESM6 (no joke)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current file (for ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let modules = [];

async function init(bot) {
    // Initialize and inject modules
    await reload(bot);
    injectModules(bot);
}

async function reload(bot) {
    modules = []; // Clear old modules

    const moduleFiles = fs
        .readdirSync(path.join(__dirname, '../modules'))
        .filter((file) => file.endsWith('.js'));

    for (const moduleFile of moduleFiles) {
        try {
            // Use absolute path for dynamic imports
            const modulePath = path.join(__dirname, `../modules/${moduleFile}`);
            const module = await import(
                `file://${modulePath}?update=${Date.now()}`
            ); // Use `file://` for ESM import

            // Add only modules that have an 'inject' function
            if (typeof module.inject === 'function') {
                modules.push({ module, name: moduleFile });
            } else {
                bot.logger.warn(`Not a valid module file: ${moduleFile}`);
            }
        } catch (error) {
            bot.logger.warn(`Failed to import module ${moduleFile}: ${error}`);
        }
    }
}

function injectModules(bot) {
    if (!bot.injectedModules) {
        bot.injectedModules = new Set(); // Track injected module names
    }

    modules.forEach(({ module, name }) => {
        // Check if the module has already been injected for this bot
        if (!bot.injectedModules.has(name)) {
            module.inject(bot); // Inject the module
            bot.injectedModules.add(name); // Mark it as injected
        }
    });
}

export { init, modules as plugins, reload };
