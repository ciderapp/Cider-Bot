const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bots latency!"),
  execute: async (interaction) => {
    await interaction.reply({ content: 'Pinging...' })
    consola.info(interaction)
    let embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Pong!🏓")
      .setDescription(`API: \`${interaction.client.ws.ping}ms\`\nLatency: \`${Date.now() - interaction.createdTimestamp}ms\``);

    await interaction.editReply({ content: "", embeds:[embed] });
  },
};
