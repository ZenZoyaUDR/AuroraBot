import { Tellraw, Text } from '../util/tellraw.js';

export const commandMeta = {
    name: 'botsay', // Command name
    permlevel: 0, // Permission level (0 for everyone)
    aliases: ['say', 'echo'], // Alternative command names
    usage: '<PREFIX>echo [message]', // How to use the command
    description: 'Let the bot repeat a message, because why not?', // Command description
};

export async function execute(command, args, bot, handler, senderName) {
    const { usage, aliases } = commandMeta; // Destructuring to use metadata easily

    if (args.length < 1) {
        const usageMessage = new Tellraw()
            .add(new Text('Invalid usage!').setColor(bot.colorPalette.THIRDARY))
            .add('\n')
            .add(new Text('Usage:').setColor(bot.colorPalette.SECONDARY))
            .add(' ')
            .add(
                new Text(
                    usage.replace('<PREFIX>', handler.prefixes[0]),
                ).setColor(bot.colorPalette.THIRDARY),
            );

        return await bot.fancymsg(usageMessage.get(false));
    }

    const messageToSay = args.join(' ');
    await bot.chat('chat', messageToSay);
}
