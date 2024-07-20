export default async function inject(bot) {
  bot.core = {
    area: {
      start: { x: 0, y: 0, z: 0 },
      end: { x: 15, y: 0, z: 15 },
    },
    position: null,
    currentBlockRelative: { x: 0, y: 0, z: 0 },

    refill() {
      const pos = bot.core.position;
      const { start, end } = bot.core.area;
      if (!pos) return;

      bot.chat(
        `/minecraft:fill ${pos.x + start.x} ${pos.y + start.y} ${
          pos.z + start.z
        } ${pos.x + end.x} ${pos.y + end.y} ${
          pos.z + end.z
        } command_block{CustomName:'{"text":"Aurora Core™","color":"#9d0aff"}'}`
      );
    },

    currentBlock() {
      const relativePosition = bot.core.currentBlockRelative;
      const corePosition = bot.core.position;
      if (!corePosition) return -1;
      return {
        x: relativePosition.x + corePosition.x,
        y: relativePosition.y + corePosition.y,
        z: relativePosition.z + corePosition.z,
      };
    },

    incrementCurrentBlock() {
      const relativePosition = bot.core.currentBlockRelative;
      const { start, end } = bot.core.area;

      relativePosition.x++;

      if (relativePosition.x > end.x) {
        relativePosition.x = start.x;
        relativePosition.z++;
      }
      if (relativePosition.z > end.z) {
        relativePosition.z = start.z;
        relativePosition.y++;
      }
      if (relativePosition.y > end.y) {
        relativePosition.x = start.x;
        relativePosition.y = start.y;
        relativePosition.z = start.z;
      }
    },

    run(command, output = false) {
      const location = bot.core.currentBlock();
      if (!location) return void bot.core.refill();
      const coords = {
        x: location.x,
        y: location.y,
        z: location.z,
      };
      bot.logger.info("RUNNING: " + command);
      bot.logger.info("OUTPUT: " + output);

      bot._client.write("update_command_block", {
        command: command.substring(0, 32767),
        coords,
        mode: 1,
        flags: 0b100,
      });

      bot.core.incrementCurrentBlock();
    },

    move(pos = bot.position) {
      bot.core.position = {
        x: Math.floor(pos.x / 16) * 16,
        y: 0,
        z: Math.floor(pos.z / 16) * 16,
      };
      bot.core.refill();
    },
  };

  bot.on("move", () => {
    bot.core.move(bot.position);
  });

  bot.on("login", () => {
    const timer = setInterval(() => {
      bot.core.refill();
    }, 60000 * 5);
    bot.on("end", () => {
      clearInterval(timer);
    });
  });
}
