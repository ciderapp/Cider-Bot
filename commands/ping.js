const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bots latency!"),
  execute: async (interaction) => {
    return interaction.reply({ content: `Pong \`${interaction.client.ws.ping}ms\` 🏓` });
  },
};
