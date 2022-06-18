import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bots latency!"),
  execute: async (interaction) => {
    let test = Date.now()
    // await interaction.reply({ embeds:[{color: "#0099ff", description: "Pinging ..."}] })
    let embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle("Pong!🏓")
      .setDescription(`API: \`${interaction.client.ws.ping}ms\`\nLatency: \`${test - interaction.createdTimestamp}ms\``);

    await interaction.reply({ content: " ", embeds: [embed] });
  },
};
