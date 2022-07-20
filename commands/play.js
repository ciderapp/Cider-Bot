import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { AudioFilters } from 'musicord';

export const command = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song!")
        .addStringOption(option => option.setName("query")
            .setDescription("The song to play!")
            .setRequired(true)
        ),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../index.js');
        const musicordPlayer = client.musicordPlayer;
        const msgArgs = interaction.options.get('query').value;
        console.log(msgArgs);
        if (!msgArgs) return interaction.reply('Argument required');
        const msgMember = interaction.guild.members.cache.get(interaction.member.user.id);
        if (msgMember && msgMember.voice.channel) {
            if (musicordPlayer.existQueue(interaction.guild)) {
                const queue = musicordPlayer.getQueue(interaction.guild);
                if (queue) await queue.play(msgArgs, msgMember.voice.channel);
                const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
                if (queueInfo && queue) interaction.reply(`${queueInfo.songs[1].title} has been added to the queue`)
            } else {
                const queue = musicordPlayer.initQueue(interaction.guild, {
                    textChannel: interaction.channel,
                    voiceChannel: msgMember.voice.channel
                });
                if (queue) {
                    interaction.deferReply();
                    queue.setFilter(AudioFilters.customEqualizer({
                        band1: 99, // 20
                        band2: 45, // 50
                        band3: 54, // 94.82
                        band4: 53, // 200
                        band5: 52, // 500
                        band6: 51, // 1000
                        band7: 50, // 2000
                        band8: 49, // 5000
                        band9: 48, // 10000
                        band10: 47, // 20000
                     }));
                    await queue.play(msgArgs, msgMember.voice.channel)
                }
                const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
                if (queueInfo) return await interaction.editReply(`Playing ${queueInfo.songs[0].title}`)
            }
        }
    }
}