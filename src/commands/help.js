import { Tellraw, Text } from '../util/tellraw.js';

export const commandMeta = {
    name: 'help', // Command name
    permlevel: 0, // Permission level (0 for everyone)
    aliases: ['help', '?', 'heko'], // Alternative command names
    usage: '<PREFIX>help <command>', // How to use the command
    description: 'Provides help and information about available commands.', // Command description
};

export async function execute(command, args, bot, handler, senderName) {
    const sendPermissionExplanation = async () => {
        let tell = new Tellraw()
            .add(
                new Text(bot.convertFont('Permission explanation')).color(
                    bot.colorPalette.THIRDARY,
                ),
            )
            .add('\n')
            .add(
                new Text(bot.convertFont(' Level 0: ')).color(
                    bot.colorPalette.THIRDARY,
                ),
            )
            .add(
                new Text('Anyone can use the command.').color(
                    bot.colorPalette.FOURTHARY,
                ),
            )
            .add('\n')
            .add(
                new Text(bot.convertFont(' Level 1: ')).color(
                    bot.colorPalette.SECONDARY,
                ),
            )
            .add(
                new Text(
                    'Only people with trusted hash can use the command.',
                ).color(bot.colorPalette.FOURTHARY),
            )
            .add('\n')
            .add(
                new Text(bot.convertFont(' Level 2: ')).color(
                    bot.colorPalette.PRIMARY,
                ),
            )
            .add(
                new Text(
                    'Only people with full access hash can use the command.',
                ).color(bot.colorPalette.FOURTHARY),
            )
            .add('\n\n')
            .add(
                new Text(
                    bot.convertFont(' If you are trusted you can see '),
                ).color(bot.colorPalette.FOURTHARY),
            )
            .add(new Text('#hash ').color(bot.colorPalette.SECONDARY))
            .add(
                new Text(
                    bot.convertFont('in the discord server to get the hash.'),
                ).color(bot.colorPalette.FOURTHARY),
            )
            .add('\n');
        await bot.fancymsg(tell.get(false));
    };

    const sendCommandNotFound = async (cmd) => {
        await bot.fancymsg(
            new Tellraw(new Text(`Command not found: ${cmd}`).color('red')).get(
                false,
            ),
        );
    };

    const sendCommandDetails = async (cmd) => {
        let tell = new Tellraw()
            .add(
                new Text('Detailed information for command').color(
                    bot.colorPalette.PRIMARY,
                ),
            )
            .add(new Text(': ').color(bot.colorPalette.FOURTHARY));

        // Check if handler.prefixes[0] and cmd.aliases exist before accessing
        if (handler.prefixes?.[0] && cmd.aliases?.[0]) {
            tell.add(
                new Text(`${handler.prefixes[0]}${cmd.aliases[0]}`).color(
                    bot.colorPalette.SECONDARY,
                ),
            );
        } else {
            tell.add(new Text('Unknown').color(bot.colorPalette.SECONDARY));
        }

        tell.add('\n').add(
            new Text(' Aliases: ').color(bot.colorPalette.FOURTHARY),
        );

        // Check if cmd.aliases exists and iterate over aliases
        if (cmd.aliases && cmd.aliases.length > 0) {
            cmd.aliases.forEach((a, i) => {
                let alias = `${handler.prefixes?.[0] ?? ''}${a}`;
                tell.add(
                    new Text(`${alias}`)
                        .color(bot.colorPalette.THIRDARY)
                        .setSuggestedCommand(alias),
                );
                if (i !== cmd.aliases.length - 1)
                    tell.add(new Text(', ').color(bot.colorPalette.FOURTHARY));
            });
        } else {
            tell.add(new Text('No aliases').color(bot.colorPalette.THIRDARY));
        }

        tell.add('\n')
            .add(new Text(' Usage:\n ').color(bot.colorPalette.FOURTHARY))
            .add(
                new Text(
                    cmd.usage?.replace(
                        /<PREFIX>/g,
                        handler.prefixes?.[0] ?? '',
                    ) || 'No usage information available',
                ).color(bot.colorPalette.SECONDARY),
            )
            .add('\n')
            .add(new Text(' Description: ').color(bot.colorPalette.FOURTHARY))
            .add(
                new Text(cmd.description || 'No description available')
                    .color(bot.colorPalette.THIRDARY)
                    .italic(),
            )
            .add('\n');

        await bot.fancymsg(tell.get(false));
    };

    const listCommands = async () => {
        // Filter out undefined commands
        let uniqueCommands = new Set(
            handler.commands.filter((cmd) => cmd !== undefined),
        );

        let cmdArray = Array.from(uniqueCommands);
        let cmdSize = cmdArray.length;

        let tell = new Tellraw()
            .add(new Text('Commands (').color(bot.colorPalette.FOURTHARY))
            .add(new Text(cmdSize).color(bot.colorPalette.SECONDARY))
            .add(new Text(') - ').color(bot.colorPalette.FOURTHARY))
            .add(new Text('{ ').bold().color(bot.colorPalette.FOURTHARY))
            .add(new Text('*').bold().color(bot.colorPalette.THIRDARY))
            .add(new Text('Public ').color(bot.colorPalette.THIRDARY))
            .add(new Text('^').bold().color(bot.colorPalette.SECONDARY))
            .add(new Text('Trusted ').color(bot.colorPalette.SECONDARY))
            .add(new Text('#').bold().color(bot.colorPalette.PRIMARY))
            .add(new Text('Full Access').color(bot.colorPalette.PRIMARY))
            .add(new Text(' }').bold().color(bot.colorPalette.FOURTHARY))
            .add('\n');

        // Sort commands based on permlevel
        cmdArray.sort((a, b) => a.permlevel - b.permlevel);
        cmdArray.forEach((c) => {
            let name = c.name ?? 'Unknown';
            let usage = `${handler.prefixes?.[0] ?? ''}${
                c.aliases?.[0] ?? ''
            } `;
            let color;

            if (c.permlevel === 0) color = bot.colorPalette.THIRDARY;
            else if (c.permlevel === 1) color = bot.colorPalette.SECONDARY;
            else if (c.permlevel === 2) color = bot.colorPalette.PRIMARY;

            tell.add(
                new Text(name)
                    .color(color)
                    .setSuggestedCommand(usage)
                    .setHover(
                        new Text('Description: ')
                            .color(bot.colorPalette.FOURTHARY)
                            .setItalic(false),
                        new Text('\n'),
                        new Text(c.description)
                            .color(bot.colorPalette.THIRDARY)
                            .setItalic(true),
                        new Text('\n')
                            .color(bot.colorPalette.FOURTHARY)
                            .setItalic(false),
                        new Text('Permission Level: ')
                            .color(bot.colorPalette.FOURTHARY)
                            .setItalic(false),
                        new Text(c.permlevel).color(bot.colorPalette.SECONDARY),
                    ),
            );
        });
        tell.add('\n');

        await bot.fancymsg(tell.get(false));
    };

    if (args.length > 0) {
        let cmd = handler.getCommand(args.join(' '));
        if (!cmd) {
            if (
                ['perm', 'perms', 'permlevel', 'permission level'].includes(
                    args.join(' '),
                )
            ) {
                await sendPermissionExplanation();
            } else {
                await sendCommandNotFound(args.join(' '));
            }
            return;
        }
        await sendCommandDetails(cmd);
    } else {
        await listCommands();
    }
}
