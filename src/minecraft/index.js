import { Tellraw, Text } from '../util/tellraw.js';
import { createBot } from './bot.js';
import * as commandManager from './managers/commandManager.js';

const bots = {};
const clientBots = [];
let globalConfig = {};

// Helper function to generate random strings for usernames
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () =>
        characters.charAt(Math.floor(Math.random() * characters.length)),
    ).join('');
}

// Create bots for each server in the provided list
function createBots(servers, config) {
    globalConfig = config; // Store config globally
    servers.forEach((server) => handleServer(server));
}

// Handle individual server connection and bot management
function handleServer(server) {
    function handleBot() {
        const bot = createBotInstance(server);
        setupBotHandlers(bot, server);
        setupChatListener(bot);
    }
    handleBot();
}

// Create a bot instance for a given server
function createBotInstance(server) {
    const bot = createBot({
        serverName: server.name,
        host: server.host,
        port: server.port,
        username: `${globalConfig.minecraft.username}_${generateRandomString(
            4,
        )}`,
        version: server.version,
        hideErrors: globalConfig.minecraft.hideErrors,
        brand: 'vanilla',
        logErrors: globalConfig.logErrors,
    });

    bots[`${server.host}:${server.port}`] = bot;
    clientBots.push(bot);
    return bot;
}

// Setup necessary handlers for bot lifecycle events (end and login)
function setupBotHandlers(bot, server) {
    bot.once('end', (reason) => handleBotEnd(bot, server, reason));
    bot._client.on('login', () => handleBotLogin(bot, server));
}

// Handle bot disconnection and automatic reconnection logic
function handleBotEnd(bot, server, reason) {
    let timeout = 3000;

    // Handle specific cooldown case
    const cooldownMessage = 'Wait 5 seconds before connecting, thanks! :)';
    if (reason.extra?.find((data) => data.text === cooldownMessage)) {
        timeout = 6000;
        bot.logger.warn(
            `[${
                bot.options.serverName === 'unknown'
                    ? `${server.host}:${server.port}`
                    : bot.options.serverName
            }] ${
                bot._client.username
            }: I'm on a 6-second cooldown before reconnecting.`,
        );
    }

    // Clean up bot from active bot lists
    delete bots[`${server.host}:${server.port}`];
    const cliBotsIndex = clientBots.indexOf(bot);
    if (cliBotsIndex !== -1) {
        clientBots.splice(cliBotsIndex, 1);
    }

    bot.logger.warn(
        `[${
            bot.options.serverName === 'unknown'
                ? `${server.host}:${server.port}`
                : bot.options.serverName
        }] ${bot._client.username}:`,
        reason,
    );

    // Attempt to reconnect the bot after a delay
    setTimeout(() => {
        bot.end();
        handleServer(server);
    }, timeout);
}

// Handle bot login and send initial commands
function handleBotLogin(bot, server) {
    bot.logger.info(
        `${bot._client.username} successfully logged in on: ${server.host}:${server.port}`,
    );
    commandManager.init(bot, globalConfig);

    // Initial setup commands
    bot.chat('command', 'op @s[type=player]');
    bot.chat('command', 'god on');
    bot.chat('command', 'cspy on');
    bot.chat('command', 'vanish on');

    bot.core.refill();

    setTimeout(() => {
        const joinMsg = new Tellraw()
            .add(
                new Text(
                    bot.convertFont('Open source Minecraft Bot By '),
                ).setColor(bot.colorPalette.FOURTHARY),
            )
            .add(new Text(bot.convertFont('Z')).setColor('#63EF83'))
            .add(new Text(bot.convertFont('e')).setColor('#67F1A2'))
            .add(new Text(bot.convertFont('n')).setColor('#6BF3C0'))
            .add(new Text(bot.convertFont('Z')).setColor('#6FF5DF'))
            .add(new Text(bot.convertFont('o')).setColor('#75E6E4'))
            .add(new Text(bot.convertFont('y')).setColor('#7BD6EA'))
            .add(new Text(bot.convertFont('a')).setColor('#81C7EF'));
        bot.fancymsg(joinMsg.get());
    }, 4000);
}

function setupChatListener(bot) {
    bot.on('custom_playerChat', (msg, uuid, plainMessage, senderName) => {
        bot.logger.chat(`[${bot.options.serverName}]`, msg);

        // Prefix check
        const prefix = commandManager.prefixes.find((prefix) =>
            plainMessage.startsWith(prefix),
        );
        if (!prefix) return;

        // Command
        const blacklistUUID = []; // Load or configure your blacklist UUIDs
        try {
            commandManager.handleCommand(
                bot,
                plainMessage,
                senderName,
                uuid,
                blacklistUUID,
            );
        } catch (err) {
            bot.logger.error(`Error handling command: ${err.stack}`);
        }
    });
}

export { bots, clientBots, createBots };
