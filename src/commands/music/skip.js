import { SlashCommandBuilder } from 'discord.js';
import { mod } from '../../data/roles.js';
import 'dotenv/config';

export const command = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip the current song"),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        const player = client.player;
        const queue = player.getQueue(interaction.guild);
        if (!queue) return await interaction.reply({ content: 'There is no song playing currently!', ephemeral: true });
        if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        if (interaction.guildId == process.env.guildId && interaction.channelId != "843954941827481670") return await interaction.reply({ content: "This command can only be used in the <#843954941827481670> channel!", ephemeral: true });
        if (interaction.guildId == process.env.guildId && await interaction.member.roles.cache.findKey(role => mod.test(role.id)) === undefined && (queue.metadata.voteskip < 3 || interaction.guild.members.me.voice.channel.members.size < 5)) {
            queue.metadata.voteskip++;
            return await interaction.reply(`You need at least 3 votes to skip the current song! (${queue.metadata.voteskip}/${3})`);
        }
        queue.metadata.voteskip = 0;
        await interaction.reply(`\`${queue.current.title}\` has been skipped!`);
        queue.skip();
    }
};
