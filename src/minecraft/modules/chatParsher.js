import { readFileSync } from 'fs';
const lang = JSON.parse(
    readFileSync(new URL('../../util/chatParser/en_us.json', import.meta.url)),
);
const regex = /^(.+):\s*\/(.+)$/gm;

function parseCommand(message) {
    const match = message.match(regex);
    if (match) {
        const username = match[1];
        const command = match[2];
        return { username, command };
    } else {
        return undefined;
    }
}

export function inject(bot) {
    bot._client.on('systemChat', (packet) => {
        const jsonmsg = JSON.parse(packet.formattedMessage);
        const msg = parseMinecraftMessage(packet.formattedMessage);
        const nocolormsg = parseMinecraftMessageNoColor(
            packet.formattedMessage,
        );
        const cspy = parseCommand(nocolormsg);
        if (jsonmsg === undefined) {
            if (msg !== undefined)
                bot.emit('custom_systemChat', msg, nocolormsg, false);
        } else {
            if (msg !== undefined)
                bot.emit('custom_systemChat', msg, nocolormsg, jsonmsg);
        }
        if (cspy !== undefined) bot.emit('custom_commandSpy', cspy);
    });

    bot._client.on('playerChat', (packet) => {
        let msg, vmsg;
        const uuid = packet.sender ? packet.sender : undefined;
        const plainMessage = packet.plainMessage
            ? packet.plainMessage
            : undefined;
        const SenderName = packet.senderName
            ? parseMinecraftMessage(packet.senderName)
            : undefined;
        const TargetName = packet.targetName
            ? parseMinecraftMessage(packet.targetName)
            : undefined;
        const formattedMessage = packet.formattedMessage
            ? parseMinecraftMessage(packet.formattedMessage)
            : undefined;
        const unsignedContent = packet.unsignedContent
            ? parseMinecraftMessage(packet.unsignedContent)
            : undefined;
        const NoColorSenderName = packet.senderName
            ? parseMinecraftMessageNoColor(packet.senderName)
            : undefined;
        const NoColorTargetName = packet.targetName
            ? parseMinecraftMessageNoColor(packet.targetName)
            : undefined;
        const NoColorformattedMessage = packet.formattedMessage
            ? parseMinecraftMessageNoColor(packet.formattedMessage)
            : undefined;
        const NoColorunsignedContent = packet.unsignedContent
            ? parseMinecraftMessageNoColor(packet.unsignedContent)
            : undefined;

        switch (packet.type) {
            case 1: // /me text
                msg = `* ${SenderName} ${formattedMessage}`;
                break;
            case 2: // someone /tell you text
                msg = `${SenderName} whispers to you: ${formattedMessage}`;
                break;
            case 3: // you /tell someone text
                msg = `You whisper to ${TargetName}: ${formattedMessage}`;
                break;
            case 4: // player chat
                // /sudo and vanish send formattedMessage message
                // normal unsignedContent
                vmsg = formattedMessage;
                msg = unsignedContent;
                break;
            case 5: // /say text
                msg = `[${SenderName}] ${
                    plainMessage ? plainMessage : formattedMessage
                }`;
                break;
            case 6: // /minecraft:teammsg text
                msg = `${TargetName} <${SenderName}> ${plainMessage}`;
                break;
            default:
                console.log(`Unknown player_chat packet. Type: ${packet.type}`);
                console.log(packet);
                break;
        }
        if (msg !== undefined)
            bot.emit(
                'custom_playerChat',
                msg,
                uuid,
                plainMessage,
                NoColorSenderName,
                TargetName,
                formattedMessage,
                unsignedContent,
                SenderName,
                NoColorTargetName,
                NoColorformattedMessage,
                NoColorunsignedContent,
            );
        if (vmsg !== undefined) bot.emit('custom_systemChat', vmsg, '', '');
    });

    const ansiColorCodes = {
        '§0': '\x1B[30m',
        '§1': '\x1B[34m',
        '§2': '\x1B[32m',
        '§3': '\x1B[36m',
        '§4': '\x1B[31m',
        '§5': '\x1B[35m',
        '§6': '\x1B[33m',
        '§7': '\x1B[37m',
        '§8': '\x1B[90m',
        '§9': '\x1B[94m',
        '§a': '\x1B[92m',
        '§b': '\x1B[96m',
        '§c': '\x1B[91m',
        '§d': '\x1B[95m',
        '§e': '\x1B[93m',
        '§f': '\x1B[97m',
        black: '\x1B[30m',
        dark_blue: '\x1B[34m',
        dark_green: '\x1B[32m',
        dark_aqua: '\x1B[36m',
        dark_red: '\x1B[31m',
        dark_purple: '\x1B[35m',
        gold: '\x1B[33m',
        gray: '\x1B[37m',
        dark_gray: '\x1B[90m',
        blue: '\x1B[94m',
        green: '\x1B[92m',
        aqua: '\x1B[96m',
        red: '\x1B[91m',
        light_purple: '\x1B[95m',
        yellow: '\x1B[93m',
        white: '\x1B[97m',
    };

    const ansiFormatCodes = {
        '§l': '\x1B[1m',
        '§o': '\x1B[3m',
        '§n': '\x1B[4m',
        '§m': '\x1B[9m',
        '§k': '\x1B[5m',
        '§r': '\x1B[0m',
        bold: '\x1B[1m',
        italic: '\x1B[3m',
        underlined: '\x1B[4m',
        strikethrough: '\x1B[9m',
        obfuscated: '\x1B[5m',
        reset: '\x1B[0m',
    };

    function parseMinecraftMessage(component) {
        let jsonComponent;
        try {
            jsonComponent = JSON.parse(component);
        } catch (e) {
            console.error('Invalid JSON format:', component);
            return '';
        }

        function extractText(comp) {
            let text = '';
            if (comp.text) {
                text += comp.text;
            }
            if (
                typeof comp[''] === 'string' ||
                (typeof comp[''] === 'number' &&
                    comp[''] !== undefined &&
                    comp[''] !== null)
            ) {
                // fix if text is {"":0} show false
                text += comp['']; // after 1337 years, i found issue at here
            }
            if (typeof comp === 'string' || typeof comp === 'number') {
                return comp;
            }

            if (comp.extra) {
                comp.extra.forEach((subComp) => {
                    text +=
                        ansiFormatCodes['reset'] +
                        parseMinecraftColor(comp.color) +
                        parseMinecraftFormat(comp) +
                        extractText(subComp) +
                        parseMinecraftColor(comp.color) +
                        parseMinecraftFormat(comp); // it must have better way, but i lazy.
                });
            }

            if (comp.translate) {
                let translateString = lang[comp.translate] || comp.translate;
                if (comp.with) {
                    const withArgs = comp.with.map((arg) => extractText(arg));
                    withArgs.forEach((arg, index) => {
                        if (arg.length > 10000) return (translateString = ''); // anti tellraw translate crash
                        translateString = translateString.replace(
                            '%s',
                            arg +
                                parseMinecraftColor(comp.color) +
                                parseMinecraftFormat(comp),
                        ); // i need make formatfunction2(comp, text) ?
                        const placeholder = new RegExp(
                            `%${index + 1}\\$s`,
                            'g',
                        ); // create tellraw translate crash
                        translateString = translateString.replace(
                            placeholder,
                            arg +
                                parseMinecraftColor(comp.color) +
                                parseMinecraftFormat(comp),
                        );
                    });
                }
                text += translateString;
            }

            text = formatfunction(comp, text);

            return text;
        }

        jsonComponent = extractText(jsonComponent);

        return jsonComponent + ansiFormatCodes['reset'];
    }

    function formatfunction(comp, text) {
        return (text =
            parseMinecraftColor(comp.color) +
            parseMinecraftFormat(comp) +
            text +
            ansiFormatCodes['reset']);
    }

    function parseMinecraftColor(color) {
        if (color && ansiColorCodes[color] && !color.startsWith('#')) {
            return ansiColorCodes[color];
        } else if (color && color.startsWith('#')) {
            const hexRegex = /#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})/;
            const hexCodes = hexRegex.exec(color);
            if (hexCodes) {
                const red = parseInt(hexCodes[1], 16);
                const green = parseInt(hexCodes[2], 16);
                const blue = parseInt(hexCodes[3], 16);
                const ansiColor = `\u001b[38;2;${red};${green};${blue}m`;
                return ansiColor;
            }
        } else {
            return '';
        }
    }

    function parseMinecraftFormat(format) {
        let result = '';
        if (format.bold) result += ansiFormatCodes['bold'];
        if (format.italic) result += ansiFormatCodes['italic'];
        if (format.underlined) result += ansiFormatCodes['underlined'];
        if (format.strikethrough) result += ansiFormatCodes['strikethrough'];
        if (format.obfuscated) result += ansiFormatCodes['obfuscated'];
        return result;
    }

    function parseMinecraftMessageNoColor(component) {
        let jsonComponent;
        try {
            jsonComponent = JSON.parse(component);
        } catch (e) {
            console.error('Invalid JSON format:', component);
        }

        function extractText(comp) {
            let text = '';

            if (comp.text) {
                text += comp.text;
            }
            if (comp['']) {
                text += comp[''];
            }
            if (typeof comp === 'string' || typeof comp === 'number') {
                text += comp;
            }
            if (comp.extra) {
                comp.extra.forEach((subComp) => {
                    text += extractText(subComp);
                });
            }
            if (comp.translate) {
                let translateString = lang[comp.translate] || comp.translate;
                if (comp.with) {
                    const withArgs = comp.with.map((arg) => extractText(arg));
                    withArgs.forEach((arg, index) => {
                        if (arg.length > 10000) return (translateString = ''); // anti tellraw translate crash
                        translateString = translateString.replace('%s', arg);
                        const placeholder = new RegExp(
                            `%${index + 1}\\$s`,
                            'g',
                        );
                        translateString = translateString.replace(
                            placeholder,
                            arg,
                        );
                    });
                }
                text += translateString;
            }

            return text;
        }

        return extractText(jsonComponent);
    }
}
