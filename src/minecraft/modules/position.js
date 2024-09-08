export function inject(bot) {
    bot.position = { x: NaN, y: NaN, z: NaN };

    bot._client.on('position', (packet) => {
        bot.position = {
            x: packet.flags & 1 ? this.x + packet.x : packet.x,
            y: packet.flags & 2 ? this.y + packet.y : packet.y,
            z: packet.flags & 4 ? this.z + packet.z : packet.z,
        };

        bot._client.write('teleport_confirm', {
            teleportId: packet.teleportId,
        });
        bot.emit('move');
    });

    bot.on('end', () => {
        bot.position = null;
    });
}
