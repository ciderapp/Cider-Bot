import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { default as pm } from 'pretty-ms';
export const command = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Shows the current song"),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        const musicordPlayer = client.musicordPlayer;
        const queue = musicordPlayer.getQueue(interaction.guild);
        const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
        if (!queue.isPlaying) return await interaction.reply('There is no song playing!');
        const member = interaction.guild.members.cache.get(interaction.member.user.id);

        consola.info(queueInfo.voiceChannel.id)
        if (queueInfo.voiceChannel.id === member.voice.channelId) {
            let slidebar = queue.generateSongSlideBar();
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle(`${queueInfo.songs[0].title}`)
                    .setAuthor({
                        name: 'Cider | Now Playing',
                        iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
                    })
                    .setDescription(`${pm(queueInfo.ressource.playbackDuration, {colonNotation: true}).split('.')[0]} ${slidebar} ${queueInfo.songs[0].duration}`)
                    .setColor('Random')
                    .setThumbnail(`https://i.ytimg.com/vi/${queueInfo.songs[0].id}/maxresdefault.jpg`)
                    .setURL(`${queueInfo.songs[0].url}`)
                ]
            });
        }
        else {
            await interaction.reply("You need to be in the same voice channel as the bot to skip the current song!");
        }
    }
};
