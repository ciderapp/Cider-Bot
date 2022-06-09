const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bots latency!"),
  execute: async (interaction) => {
    let test = Date.now()
    await interaction.reply({ embeds:[{color: "#0099ff", description: "Pinging ..."}] })
    let embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Pong!🏓")
      .setDescription(`API: \`${interaction.client.ws.ping}ms\`\nLatency: \`${test - interaction.createdTimestamp}ms\``);
    
    await interaction.editReply({ content: " ", embeds:[embed] });
  },
};
