import { EventEmitter } from 'events';
import minecraft from 'minecraft-protocol';
import loggerModule from '../util/logger.js';
const logger = loggerModule({ logLevel: 1 });
EventEmitter.defaultMaxListeners = Infinity;

import convertFont from '../util/convertFont.js';
import { Tellraw, Text } from '../util/tellraw.js';
import * as pluginManager from './managers/pluginManager.js';

export function createBot(options = {}) {
    const {
        username = 'Aurora',
        version = '1.20.4',
        hideErrors = false,
        brand = 'vanilla',
        logErrors = true,
        serverName = 'unknown',
        host,
        port,
    } = options;

    const bot = new EventEmitter();
    bot.options = {
        username,
        version,
        hideErrors,
        brand,
        logErrors,
        serverName,
        host,
        port,
    };
    bot.chatqueue = [];
    bot.logger = logger;

    if (logErrors) {
        bot.on('error', (err) => {
            if (!hideErrors) console.error(err);
        });
    }

    bot._client = minecraft.createClient({
        host,
        port,
        username,
        version,
        hideErrors,
        brand,
    });

    pluginManager.init(bot);
    bot.plmanager = pluginManager;

    bot.chat = (type, value) => {
        if (type === 'command') {
            bot._client.write('chat_command', {
                command: value?.substring(0, 256),

                timestamp: BigInt(Date.now()),
                salt: 0n,
                argumentSignatures: [],
                signedPreview: false,
                messageCount: 0,
                acknowledged: Buffer.alloc(3),
                previousMessages: [],
            });
        }
        if (type === 'chat') {
            const acc = 0;
            const bitset = Buffer.allocUnsafe(3);
            bitset[0] = acc & 0xff;
            bitset[1] = (acc >> 8) & 0xff;
            bitset[2] = (acc >> 16) & 0xff;

            bot._client.write('chat_message', {
                message: value?.substring(0, 256),
                timestamp: BigInt(Date.now()),
                salt: 0n,
                offset: 0,
                acknowledged: bitset,
            });
        }
    };

    /* bot.write = (name, data) => bot._client.write(name, data);
  bot.chat = (message) => bot.write("chat", { message });

  bot.delayedChat = (msg) => {
    if (bot.chatqueue.length < 30) {
      let msgToSend = msg.replace(/\\n/g, " ");
      if (msgToSend.length > 255) msgToSend = msgToSend.slice(0, 255);
      bot.chatqueue.push(msgToSend);
    }
  };

  setInterval(() => {
    if (bot.chatqueue.length > 0) {
      bot.chat(bot.chatqueue.shift());
    }
  }, 500); */

    bot.convertFont = (str) => convertFont(str);
    bot.colorPalette = {
        // #9f0fff #db69ff #ffaaff
        PRIMARY: '#9f0fff',
        SECONDARY: '#db69ff',
        THIRDARY: '#ffaaff',
        DANGER: '#E6143C',
        FOURTHARY: 'gray',
    };

    const generatePrefix = (text, colors) => {
        const gradients = generateGradientText(
            bot.convertFont(text),
            ...colors,
        );

        const prefix = new Tellraw();
        gradients.forEach(({ char, color }) => {
            prefix.add(new Text(char).setColor(color));
        });
        prefix.add(new Text(' › ').setColor(colors[3]));

        return prefix.get(false);
    };

    const prefix = generatePrefix('Aurora', [
        bot.colorPalette.PRIMARY,
        bot.colorPalette.SECONDARY,
        bot.colorPalette.THIRDARY,
        bot.colorPalette.FOURTHARY,
    ]);

    bot.tellraw = (text, selector = '@a') => {
        if (!bot.core) {
            bot.core.refill();
            bot.core.run(
                `minecraft:tellraw ${selector} ${JSON.stringify(text)}`,
            );
            console.info('Refilled missing core');
        } else {
            bot.core.run(
                `minecraft:tellraw ${selector} ${JSON.stringify(text)}`,
            );
        }
    };

    bot.fancymsg = (text, selector = '@a') => {
        if (typeof text === 'object') {
            const prf = [...prefix, ...(Array.isArray(text) ? text : [text])];
            bot.tellraw(prf, selector);
        } else {
            bot.tellraw(`${text.startsWith('§') ? '' : ''} ${text}`, selector);
        }
    };

    bot.npxfanmsg = (text, selector) => {
        if (typeof text === 'object') {
            return bot.tellraw(text, selector);
        }
        bot.tellraw(`${text.startsWith('§') ? '' : ''} ${text}`, selector);
    };

    bot.end = (reason = 'end') => {
        bot.emit('end', reason);
        bot.removeAllListeners();
        bot._client.end();
        bot._client.removeAllListeners();
    };

    bot._client.on('connect', () => bot.emit('connect'));
    bot._client.on('login', (client) => bot.emit('login', client));
    bot._client.on('error', (error) => bot.emit('error', error));
    bot._client.on('end', (reason) => bot.emit('end', reason, 'end'));
    // bot._client.on("kick_disconnect", (data) => {
    //   console.log(data)
    //   bot.emit("end", "cool", "kick_disconnect");
    // });
    // bot._client.on("disconnect", (data) => {
    //   const parsed = JSON.parse(data);
    //   bot.emit("end", "heh", "disconnect");
    // });

    return bot;
}

function generateGradientText(text, color1, color2, color3 = null) {
    const length = text.length;
    const gradientTextArray = [];

    for (let i = 0; i < length; i++) {
        let color;
        if (color3) {
            const mid = length / 2;
            color =
                i < mid
                    ? interpolateColor(color1, color2, i / mid)
                    : interpolateColor(color2, color3, (i - mid) / mid);
        } else {
            color = interpolateColor(color1, color2, i / length);
        }
        gradientTextArray.push({ char: text[i], color });
    }

    return gradientTextArray;
}

function interpolateColor(color1, color2, factor) {
    const hex = (color) => parseInt(color.slice(1), 16);
    const r1 = (hex(color1) >> 16) & 0xff;
    const g1 = (hex(color1) >> 8) & 0xff;
    const b1 = hex(color1) & 0xff;
    const r2 = (hex(color2) >> 16) & 0xff;
    const g2 = (hex(color2) >> 8) & 0xff;
    const b2 = hex(color2) & 0xff;

    const r = Math.round(r1 + (r2 - r1) * factor)
        .toString(16)
        .padStart(2, '0');
    const g = Math.round(g1 + (g2 - g1) * factor)
        .toString(16)
        .padStart(2, '0');
    const b = Math.round(b1 + (b2 - b1) * factor)
        .toString(16)
        .padStart(2, '0');

    return `#${r}${g}${b}`;
}
