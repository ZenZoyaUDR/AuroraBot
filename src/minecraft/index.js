import fs from 'fs';
import js_yaml from 'js-yaml';
import path from 'path';
import { Tellraw, Text } from '../util/tellraw.js';
import { createBot } from './bot.js';

// Load the configuration
const configPath = path.join('./config.yml');
const config = js_yaml.load(fs.readFileSync(configPath));

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () =>
        characters.charAt(Math.floor(Math.random() * characters.length)),
    ).join('');
}

const bots = {};
const clientBots = [];

function createBots(servers) {
    servers.forEach((server) => handleServer(server));
}

function handleServer(server) {
    function handleBot() {
        const bot = createBotInstance(server);
        setupBotHandlers(bot, server);
        setupBotCommands(bot);
    }

    handleBot();
}

function createBotInstance(server) {
    const bot = createBot({
        serverName: server.name,
        host: server.host,
        port: server.port,
        username: `${config.minecraft.username}_${generateRandomString(4)}`,
        version: server.version,
        hideErrors: config.minecraft.hideErrors,
        brand: 'vanilla',
        logErrors: config.logErrors,
    });

    bots[`${server.host}:${server.port}`] = bot;
    clientBots.push(bot);
    return bot;
}

function setupBotHandlers(bot, server) {
    bot.once('end', (reason) => handleBotEnd(bot, server, reason));
    bot._client.on('login', () => handleBotLogin(bot, server));
}

function handleBotEnd(bot, server, reason) {
    let timeout = 3000;
    if (
        reason.extra?.find(
            (data) =>
                data.text === 'Wait 5 seconds before connecting, thanks! :)',
        )
    ) {
        timeout = 6000;
        bot.logger.warn(
            `[${
                bot.options.serverName === 'unknown'
                    ? `${server.host}:${server.port}`
                    : bot.options.serverName
            }] ${
                bot._client.username
            }: Im on 6 seconds cooldown before connecting.`,
        );
    }

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
    setTimeout(() => {
        bot.end();
        handleServer(server);
    }, timeout);
}

function handleBotLogin(bot, server) {
    bot.logger.info(
        `${bot._client.username} successfully login on: ${server.host}:${server.port}`,
    );
    // commandHandler.init(bot);
    // bot.musicplayer = new MusicPlayer(bot);

    bot.chat('command', 'op @s[type=player]');
    bot.chat('command', 'god on');
    bot.chat('command', 'cspy on');
    bot.chat('command', 'vanish on');
    // bot.delayedChat(`/minecraft:tp ${Math.floor(Math.random() * 100000)} 100 ${Math.floor(Math.random() * 100000)}`)

    bot.core.refill();
    setInterval(() => {
        const joinmsg = new Tellraw()
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
        bot.fancymsg(joinmsg.get());
    }, 1000);
}

function setupBotCommands(bot) {
    let blacklisted = [];

    bot.on('custom_playerChat', (msg, uuid, plainMessage) => {
        if (plainMessage == 'aura:test') bot.tellraw('HEY :D');
        //     const message = msg.clean;
        //     if (message.length <= 1) return;
        //     if (message.startsWith('^')) {
        //         sendPrefixChangeMessage(bot, user);
        //     }
        //     handleCommand(bot, user, msg, blacklisted);
    });
}

// function sendPrefixChangeMessage(bot, user) {
//     const tell = new Tellraw()
//         .add(
//             new Text(
//                 bot.convertFont(
//                     'Hey! Horizon how used new and improved prefix!',
//                 ),
//             ).setColor(bot.colorPalette.THIRDARY),
//         )
//         .add('\n\n')
//         .add(
//             new Text(
//                 bot.convertFont('The prefix now used is a namespace prefix.'),
//             ).setColor(bot.colorPalette.SECONDARY),
//         )
//         .add('\n\n')
//         .add(new Text('> ').setColor(bot.colorPalette.FOURTHARY))
//         .add(
//             new Text(
//                 bot.convertFont(
//                     'Why the change? well its because the old standard',
//                 ),
//             ).setColor(bot.colorPalette.SECONDARY),
//         )
//         .add('\n')
//         .add(
//             new Text(
//                 bot.convertFont(
//                     ' of prefix is not feasible any more, due to growing',
//                 ),
//             ).setColor(bot.colorPalette.SECONDARY),
//         )
//         .add('\n')
//         .add(
//             new Text(
//                 bot.convertFont(
//                     ' amount of bots and limited single characters prefix.',
//                 ),
//             ).setColor(bot.colorPalette.SECONDARY),
//         )
//         .add('\n\n')
//         .add(
//             new Text(
//                 bot.convertFont('So from now on to continue using'),
//             ).setColor(bot.colorPalette.THIRDARY),
//         )
//         .add(new Text(" Horizon's ").setColor(bot.colorPalette.SECONDARY))
//         .add('\n')
//         .add(
//             new Text(bot.convertFont(' commands use ')).setColor(
//                 bot.colorPalette.THIRDARY,
//             ),
//         )
//         .add(new Text('"izon:"').setColor(bot.colorPalette.SECONDARY))
//         .add(new Text(', ').setColor(bot.colorPalette.FOURTHARY))
//         .add(new Text('"horiz:"').setColor(bot.colorPalette.SECONDARY))
//         .add(new Text(', or ').setColor(bot.colorPalette.FOURTHARY))
//         .add(new Text('"horizon:"').setColor(bot.colorPalette.SECONDARY))
//         .add('\n\n')
//         .add(
//             new Text(
//                 bot.convertFont(' (Only you can see this message)'),
//             ).setColor('gray'),
//         )
//         .add('\n');

//     bot.fancymsg(tell.get(false), user.clean);
// }

// function handleCommand(bot, user, msg, blacklisted) {
//     const message = msg.clean;
//     let args = [];
//     let command = '';
//     let dirtyargs = [];

//     const prefix = commandHandler.prefixes.find((prefix) =>
//         message.startsWith(prefix),
//     );
//     if (!prefix) return;

//     args = message.slice(prefix.length).split(' ');
//     command = args.shift();
//     dirtyargs = msg.raw.split(' ').slice(1);

//     bot.logger.debug(`Command detected: ${command}, Args: ${args.join(' ')}`);

//     if (blacklisted.includes(user.clean)) {
//         sendBlacklistMessage(bot, user);
//         return;
//     }

//     try {
//         commandHandler.executeCmd(
//             command,
//             args,
//             bot,
//             user.clean,
//             dirtyargs,
//             user.raw,
//             message.startsWith('/'),
//         );
//     } catch (e) {
//         handleCommandError(bot, e);
//     }
// }

// function sendBlacklistMessage(bot, user) {
//     const tell = new Tellraw()
//         .add(
//             new Text(
//                 bot.convertFont('You are blacklisted from using'),
//             ).setColor(bot.colorPalette.THIRDARY),
//         )
//         .add(new Text(" Horizon's ").setColor(bot.colorPalette.SECONDARY))
//         .add(
//             new Text(bot.convertFont('commands.')).setColor(
//                 bot.colorPalette.THIRDARY,
//             ),
//         )
//         .add('\n')
//         .add(
//             new Text(
//                 bot.convertFont(
//                     ' If you think this is a mistake please contact the bot owner',
//                 ),
//             ).setColor(bot.colorPalette.THIRDARY),
//         )
//         .add(
//             new Text(bot.convertFont(' here (click me)'))
//                 .setColor(bot.colorPalette.SECONDARY)
//                 .setURL(config.discord.discordLink),
//         )
//         .add(new Text('.').setColor(bot.colorPalette.THIRDARY))
//         .add(
//             new Text(
//                 bot.convertFont(' (Only you can see this message)'),
//             ).setColor('gray'),
//         )
//         .add('\n\n');

//     bot.fancymsg(tell.get(false), user.clean);
// }

// function handleCommandError(bot, e) {
//     let tell;
//     if (e.message.startsWith('Command not found: ')) {
//         tell = new Tellraw()
//             .add(
//                 new Text('Command not found: ').setColor(
//                     bot.colorPalette.THIRDARY,
//                 ),
//             )
//             .add(
//                 new Text(e.message.split('Command not found: ')[1]).setColor(
//                     bot.colorPalette.SECONDARY,
//                 ),
//             );
//     } else if (e.message.startsWith('Invalid trusted hash!')) {
//         tell = new Tellraw().add(
//             new Text(
//                 bot.convertFont('Please provide valid trusted hash!'),
//             ).setColor(bot.colorPalette.DANGER),
//         );
//     } else if (e.message.startsWith('Invalid full access hash!')) {
//         tell = new Tellraw().add(
//             new Text(
//                 bot.convertFont('Please provide valid full access hash!'),
//             ).setColor(bot.colorPalette.DANGER),
//         );
//     } else {
//         tell = new Tellraw().add(
//             new Text(
//                 bot.convertFont(
//                     'An command error occurred check console for more info.',
//                 ),
//             ).setColor(bot.colorPalette.DANGER),
//         );
//         bot.logger.error(e);
//     }

//     bot.fancymsg(tell.get(false));
// }

export { bots, clientBots, createBots };
