import chalk from "chalk";

const LogLevels = {
  Debug: 0,
  Info: 1,
  Success: 2,
  Warn: 3,
  Error: 4,
  Fatal: 5,
};

const prefixes = new Map([
  [LogLevels.Debug, "[DEBUG]"],
  [LogLevels.Info, "[INFO]"],
  [LogLevels.Success, "[SUCCESS]"],
  [LogLevels.Warn, "[WARN]"],
  [LogLevels.Error, "[ERROR]"],
  [LogLevels.Fatal, "[FATAL]"],
]);

const colorFunctions = new Map([
  [LogLevels.Debug, chalk.gray],
  [LogLevels.Info, chalk.cyan],
  [LogLevels.Success, chalk.green.bold],
  [LogLevels.Warn, chalk.yellow],
  [LogLevels.Error, chalk.red],
  [LogLevels.Fatal, chalk.red.bold.italic],
]);

function writeLog(logMessage) {
  process.stdout.write(logMessage.join(" ") + "\n");
}

function logger({ logLevel = LogLevels.Info } = {}) {
  function log(level, ...args) {
    if (level < logLevel) return;

    const color = colorFunctions.get(level) || ((str) => str);
    const date = new Date();
    const logMessage = [
      chalk.gray(`[${date.toLocaleTimeString()}]`),
      color(prefixes.get(level) || "[DEBUG]"),
      chalk.gray(":"),
      ...args,
    ];

    writeLog(logMessage);
  }

  function setLevel(level) {
    logLevel = level;
  }

  const logMethods = {};
  Object.keys(LogLevels).forEach((key) => {
    logMethods[key.toLowerCase()] = (...args) => log(LogLevels[key], ...args);
  });

  return {
    log,
    setLevel,
    ...logMethods,
  };
}

export default logger;
