import chalk from 'chalk';

const LogLevels = {
    Chat: 1,
    Info: 2,
    Success: 3,
    Warn: 4,
    Error: 5,
    Fatal: 6,
};

const prefixes = new Map([
    [LogLevels.Chat, ' CHAT '],
    [LogLevels.Info, ' INFO '],
    [LogLevels.Success, ' SUCE '],
    [LogLevels.Warn, ' WARN '],
    [LogLevels.Error, ' ERROR '],
    [LogLevels.Fatal, ' FATAL '],
]);

const colorFunctions = new Map([
    [LogLevels.Chat, chalk.bgGray.white],
    [LogLevels.Info, chalk.bgCyan.white],
    [LogLevels.Success, chalk.bgGreen.white],
    [LogLevels.Warn, chalk.bgYellow.white],
    [LogLevels.Error, chalk.bgRed.white],
    [LogLevels.Fatal, chalk.bgHex('#BE1A5A').bold.italic.white],
]);

function writeLog(logMessage) {
    process.stdout.write(logMessage.join(' ') + '\n');
}

function logger({ logLevel = LogLevels.Info } = {}) {
    function log(level, ...args) {
        if (level < logLevel) return;

        const color = colorFunctions.get(level) || ((str) => str);
        const date = new Date();
        const logMessage = [
            chalk.gray(`[${date.toLocaleTimeString()}]`),
            color(prefixes.get(level) || ' INFO '),
            chalk.gray(':'),
            ...args,
        ];

        writeLog(logMessage);
    }

    function setLevel(level) {
        logLevel = level;
    }

    const logMethods = {};
    Object.keys(LogLevels).forEach((key) => {
        logMethods[key.toLowerCase()] = (...args) =>
            log(LogLevels[key], ...args);
    });

    return {
        log,
        setLevel,
        ...logMethods,
    };
}

export default logger;
