import { SlashCommandBuilder, underscore } from 'discord.js';
import { mod } from '../../data/roles.js';
import 'dotenv/config';

export const command = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stops the current queue"),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        const player = client.player;
        const queue = player.getQueue(interaction.guild);
        if (!queue) return await interaction.reply({ content: 'There is no song playing currently!', ephemeral: true });
        if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        if (interaction.guildId == process.env.guildId && interaction.channelId != "843954941827481670") return await interaction.reply({ content: "This command can only be used in the <#843954941827481670> channel!", ephemeral: true });
        const halfOfQueue = (interaction.guild.members.me.voice.channel.members.size / 2) - 1
        if (interaction.guildId == process.env.guildId && interaction.member.roles.cache.findKey(role => mod.test(role.id)) === undefined && queue.metadata.votestop < Math.floor(halfOfQueue)) {
            queue.metadata.votestop++;
            return await interaction.reply(`You need at least ${Math.floor(halfOfQueue)} votes to skip the current song! (${queue.metadata.votestop}/${Math.floor(halfOfQueue)})`);
        }
        queue.metadata.votestop = 0;
        await interaction.reply(`\`${queue.current.title}\` check console`);
        queue.stop();
        // queue.skip();
    }
};
