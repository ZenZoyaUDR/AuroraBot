const fs = require('fs');
const path = require('path');
const js_yaml = require('js-yaml');
const { genHash, hashCheck } = require('../../util/hash.js');

const config = js_yaml.load(
    fs.readFileSync(path.join(__dirname, '../../../', 'config.yml')),
);
const prefixes = config.prefixes;
let commands = new Map();

function init(bot) {
    genHash('all', bot);
    reload();
}

function reload() {
    // Clear the require cache for command files & current commands map
    Object.keys(require.cache).forEach((module) => {
        if (module.startsWith(path.resolve('src/commands/'))) {
            delete require.cache[module];
        }
    });
    commands.clear();

    // Read and load all command files
    fs.readdirSync('src/commands/')
        .filter((cmd) => cmd.endsWith('.js'))
        .forEach((cmd) => {
            try {
                const cmdData = require(path.resolve(`src/commands/${cmd}`));
                if (isValidCmd(cmdData)) {
                    cmdData.aliases.forEach((alias) => {
                        commands.set(alias.toLowerCase(), cmdData);
                    });
                } else {
                    console.log(`Invalid command file: ${cmd}`);
                }
            } catch (err) {
                console.log(`Error while loading command ${cmd}:`, err);
            }
        });
}

function isValidCmd(cmdData) {
    return (
        typeof cmdData.permlevel === 'number' &&
        Array.isArray(cmdData.aliases) &&
        typeof cmdData.usage === 'string' &&
        typeof cmdData.description === 'string' &&
        typeof cmdData.execute === 'function'
    );
}

function getCommand(cmd) {
    cmd = cmd.toLowerCase();
    for (const prefix of prefixes) {
        if (cmd.startsWith(prefix)) {
            cmd = cmd.slice(prefix.length);
        }

        if (commands.has(cmd)) {
            return commands.get(cmd);
        }
    }
    throw new Error(`Command not found: ${cmd}`);
}

function executeCmd(command, args, bot, username, rawargs, rawuser, cspy) {
    let cmd = getCommand(command);
    if (cmd.permlevel === 1) {
        if (hashCheck('trust', args[0])) {
            args.shift();
            genHash('trust', bot);
            return cmd.execute(
                command,
                args,
                bot,
                this,
                username,
                rawargs,
                rawuser,
                cspy,
            );
        } else {
            throw new Error('Invalid trusted hash!');
        }
    } else if (cmd.permlevel === 2) {
        if (hashCheck('full', args[0])) {
            args.shift();
            genHash('full', bot);
            return cmd.execute(
                command,
                args,
                bot,
                this,
                username,
                rawargs,
                rawuser,
                cspy,
            );
        } else {
            throw new Error('Invalid full access hash!');
        }
    }
    return cmd.execute(
        command,
        args,
        bot,
        this,
        username,
        rawargs,
        rawuser,
        cspy,
    );
}

module.exports = {
    init,
    reload,
    getCommand,
    isValidCmd,
    executeCmd,
    commands,
    prefixes,
};
