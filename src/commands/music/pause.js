import { SlashCommandBuilder, EmbedBuilder, resolveColor } from 'discord.js';
import 'dotenv/config';

export const command = {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pause the current song"),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        const player = client.player;
        const queue = player.getQueue(interaction.guild);
        if (!queue) return await interaction.reply({ content: 'There is no song playing currently!', ephemeral: true });
        if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        if (queue.connection.paused) return await interaction.reply({ content: "I'm already paused!", ephemeral: true });
        if (interaction.guildId == process.env.guildId && interaction.channelId != "843954941827481670") return await interaction.reply({ content: "This command can only be used in the <#843954941827481670> channel!", ephemeral: true });        
        await interaction.reply(`The queue in **${interaction.guild.name}** has been paused!`);
        queue.setPaused(true);
    }
};
