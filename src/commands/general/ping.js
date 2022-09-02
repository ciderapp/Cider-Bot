import { SlashCommandBuilder, EmbedBuilder, resolveColor } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Get the bots latency!")
        .addBooleanOption(option => option.setName("show")
        .setDescription("Show to everyone!")
        .setRequired(false)
    ),
    category: 'General',
    execute: async (interaction) => {
        let show = interaction.options.getBoolean('show') || false;
        let reply = await interaction.reply({ embeds: [{ color: resolveColor('Random'), description: "Pinging..." }], ephemeral: !show, fetchReply:true })
        let embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Pong!🏓")
            .setDescription(`API: \`${interaction.client.ws.ping}ms\`\nLatency: \`${reply.createdTimestamp - interaction.createdTimestamp}ms\``);
        await interaction.editReply({ content: " ", embeds: [embed], ephemeral: !show });
    }
};
