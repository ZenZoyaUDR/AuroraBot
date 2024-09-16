import fs from 'fs';
import path from 'path';
import { genHash, hashCheck } from './hashManager.js';
import { Tellraw, Text } from '../../util/tellraw.js';

let commands = new Map();
let aliases = new Map(); // New map to store aliases
let prefixes = [];

/**
 * Command Manager logic
 */
export function init(bot, config) {
    prefixes = config.prefixes;
    genHash('all', bot);
    reload();
}

export function reload() {
    commands.clear();
    aliases.clear(); // Clear aliases when reloading commands

    const commandDir = path.resolve('src/commands/');
    const commandFiles = fs
        .readdirSync(commandDir)
        .filter((cmd) => cmd.endsWith('.js'));

    commandFiles.forEach(async (cmdFile) => {
        try {
            const cmdModule = await import(`${commandDir}/${cmdFile}`);

            if (isValidCmd(cmdModule)) {
                const { commandMeta } = cmdModule;

                // Store the command only once by its name
                commands.set(commandMeta.name.toLowerCase(), cmdModule);

                // Map all aliases to the main command's name
                commandMeta.aliases.forEach((alias) => {
                    aliases.set(
                        alias.toLowerCase(),
                        commandMeta.name.toLowerCase(),
                    );
                });
            } else {
                console.log(`Invalid command file: ${cmdFile}`);
            }
        } catch (err) {
            console.log(`Error while loading command ${cmdFile}:`, err.stack);
        }
    });
}

/**
 * Validates whether the command structure matches the required format
 */
export function isValidCmd(cmdModule) {
    const { commandMeta, execute } = cmdModule;
    return (
        commandMeta &&
        typeof commandMeta.name === 'string' &&
        typeof commandMeta.description === 'string' &&
        Array.isArray(commandMeta.aliases) &&
        typeof commandMeta.permlevel === 'number' &&
        typeof commandMeta.usage === 'string' &&
        typeof execute === 'function'
    );
}

export function getCommand(cmd) {
    cmd = cmd.toLowerCase();
    for (const prefix of prefixes) {
        if (cmd.startsWith(prefix)) {
            cmd = cmd.slice(prefix.length);
        }

        // Check if the command exists in the main commands map or the aliases map
        if (commands.has(cmd)) {
            return commands.get(cmd);
        } else if (aliases.has(cmd)) {
            return commands.get(aliases.get(cmd)); // Get the main command from the alias
        }
    }
    throw new Error(`Command not found: ${cmd}`);
}

export function executeCmd(command, args, bot, senderName, senderUUID) {
    const cmdModule = getCommand(command);
    const { permlevel } = cmdModule.commandMeta;

    const handler = { reload, prefixes, commands, aliases }; // Include aliases in the handler

    if (permlevel === 1) {
        if (hashCheck('trust', args[0])) {
            args.shift();
            genHash('trust', bot);
            return cmdModule.execute(
                command,
                args,
                bot,
                handler,
                senderName,
                senderUUID,
            );
        } else {
            throw new Error('Invalid trusted hash!');
        }
    } else if (permlevel === 2) {
        if (hashCheck('full', args[0])) {
            args.shift();
            genHash('full', bot);
            return cmdModule.execute(
                command,
                args,
                bot,
                handler,
                senderName,
                senderUUID,
            );
        } else {
            throw new Error('Invalid full access hash!');
        }
    }

    return cmdModule.execute(
        command,
        args,
        bot,
        handler,
        senderName,
        senderUUID,
    );
}

export function handleCommand(bot, message, senderName, uuid, blacklistUUID) {
    let args = [];
    let command = '';

    const prefix = prefixes.find((prefix) => message.startsWith(prefix));
    args = message.slice(prefix.length).split(' ');
    command = args.shift();

    bot.logger.info(`Command detected: ${command}, Args: ${args.join(' ')}`);

    if (blacklistUUID.includes(uuid)) {
        sendBlacklistMessage(bot, senderName);
        return;
    }

    try {
        executeCmd(command, args, bot, senderName, uuid);
    } catch (err) {
        handleCommandError(bot, err);
    }
}

function sendBlacklistMessage(bot, name) {
    const tell = new Tellraw()
        .add(
            new Text(
                bot.convertFont('You are blacklisted from using'),
            ).setColor(bot.colorPalette.THIRDARY),
        )
        .add(new Text(" Aurora's ").setColor(bot.colorPalette.SECONDARY))
        .add(
            new Text(bot.convertFont('commands.')).setColor(
                bot.colorPalette.THIRDARY,
            ),
        )
        .add('\n')
        .add(
            new Text(
                bot.convertFont(' (Only you can see this message)'),
            ).setColor('gray'),
        )
        .add('\n\n');

    bot.fancymsg(tell.get(false), name);
}

function handleCommandError(bot, err) {
    let tell;
    const errorMsg = err.message;

    if (errorMsg.startsWith('Command not found: ')) {
        tell = new Tellraw()
            .add(
                new Text('Command not found: ').setColor(
                    bot.colorPalette.THIRDARY,
                ),
            )
            .add(
                new Text(errorMsg.split('Command not found: ')[1]).setColor(
                    bot.colorPalette.SECONDARY,
                ),
            );
    } else if (errorMsg.startsWith('Invalid trusted hash!')) {
        tell = new Tellraw().add(
            new Text(
                bot.convertFont('Please provide valid trusted hash!'),
            ).setColor(bot.colorPalette.DANGER),
        );
    } else if (errorMsg.startsWith('Invalid full access hash!')) {
        tell = new Tellraw().add(
            new Text(
                bot.convertFont('Please provide valid full access hash!'),
            ).setColor(bot.colorPalette.DANGER),
        );
    } else {
        tell = new Tellraw().add(
            new Text(
                bot.convertFont(
                    'An error occurred, check console for more info.',
                ),
            ).setColor(bot.colorPalette.DANGER),
        );
        bot.logger.error(err);
    }

    bot.fancymsg(tell.get(false));
}

export { prefixes, commands, aliases };
