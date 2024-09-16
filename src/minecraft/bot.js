import { EventEmitter } from 'events';
import minecraft from 'minecraft-protocol';
import loggerModule from '../util/logger.js';
const logger = loggerModule({ logLevel: 1 });
EventEmitter.defaultMaxListeners = Infinity;

import convertFont from '../util/convertFont.js';
import { generateGradientText } from '../util/gradientsGen.js';
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
