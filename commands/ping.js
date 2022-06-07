const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bots latency!"),
  execute: async (interaction) => {
    await interaction.reply({ content: 'Pinging...' });
    let embed = new MessageEmbed()
      .setColor("#0099ff")
      .setDescription(`API: ${interaction.message.client.ws.ping}ms\nLatency: ${Date.now() - interaction.message.createdTimestamp}ms`);

    await interaction.editReply({ content: 'Pong!🏓', embed });
  },
};
