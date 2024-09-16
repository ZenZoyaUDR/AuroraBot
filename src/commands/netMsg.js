import { Tellraw, Text } from '../util/tellraw.js';
import { clientBots } from '../minecraft/index.js';

import { generateGradientText } from '../util/gradientsGen.js';

export const commandMeta = {
    name: 'netmsg', // Command name
    permlevel: 0, // Permission level (0 for everyone)
    aliases: ['netmsg'], // Alternative command names
    usage: '<PREFIX>netmsg [message]', // How to use the command
    description: 'Sends a message to all servers the bot is connected to', // Command description
};

export async function execute(
    command,
    args,
    bot,
    handler,
    senderName,
    senderUUID,
) {
    const { usage } = commandMeta;

    // Ensure prefixes exist, fallback to default if not
    const prefix = handler?.prefixes?.[0] ?? '<PREFIX>'; // Access handler.prefixes safely

    if (args.length < 1) {
        const usageMessage = new Tellraw()
            .add(new Text('Invalid usage!').setColor(bot.colorPalette.THIRDARY))
            .add('\n')
            .add(new Text('Usage:').setColor(bot.colorPalette.SECONDARY))
            .add(' ')
            .add(
                new Text(usage.replace('<PREFIX>', prefix)).setColor(
                    bot.colorPalette.THIRDARY,
                ),
            );

        return await bot.fancymsg(usageMessage.get(false));
    }

    const gradients = generateGradientText(
        bot.convertFont('NetMsg'),
        bot.colorPalette.PRIMARY,
        bot.colorPalette.SECONDARY,
        bot.colorPalette.THIRDARY,
    );

    let msg = args.join(' ');
    let server = bot._client.socket._host;
    clientBots.forEach((bot) => {
        let tell = new Tellraw().add(new Text('[').color('dark_gray'));
        gradients.forEach(({ char, color }) => {
            tell.add(new Text(char).setColor(color));
        });
        tell.add(new Text(' | ').color('dark_gray'))
            .add(new Text(server).color('gray'))
            .add(new Text('] ').color('dark_gray'))
            .add(
                new Text(senderName)
                    .color('gray')
                    .setHover(
                        new Text('UUID: ').color('gray').setItalic(false),
                        new Text('\n'),
                        new Text(senderUUID)
                            .color(bot.colorPalette.THIRDARY)
                            .setItalic(true),
                    ),
            )
            .add(new Text(' » ').color('dark_gray'));
        let message = generateGradientText(
            msg,
            bot.colorPalette.SECONDARY,
            bot.colorPalette.THIRDARY,
        );
        message.forEach(({ char, color }) => {
            tell.add(new Text(char).setColor(color));
        });

        bot.npxfanmsg(tell.get());
    });
}
