import { SlashCommandBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip the current song"),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../index.js');
        const musicordPlayer = client.musicordPlayer;
        const queue = musicordPlayer.getQueue(interaction.guild);
        const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
        if (!queue.isPlaying) return await interaction.reply('There is no song playing!');
        const member = interaction.guild.members.cache.get(interaction.member.user.id);

        consola.info(queueInfo.voiceChannel.id)
        if (queueInfo.voiceChannel.id === member.voice.channelId) {
            queue.skip();
            await interaction.reply("Song skipped!");
        }
        else {
            await interaction.reply({content: `You need to be in a voice channel to use this command!`, ephemeral: true});
        }
    }
};
