import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
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
        const SongSearcher = client.SongSearcher;
        let msgArgs = interaction.options.get('query').value;
        const msgMember = interaction.guild.members.cache.get(interaction.member.user.id);
        if (msgMember && msgMember.voice.channel) {
            if (!msgArgs) return interaction.reply('Argument required');
            if (!msgArgs.startsWith('https://')) {
                const searchedSongs = await SongSearcher.search(msgArgs, { maxResults: 10 });
                msgArgs = searchedSongs[0].url;
                await addToQueue(interaction, musicordPlayer, msgMember, msgArgs);
            }
            else if (msgArgs.startsWith('https://music.apple.com/') || msgArgs.startsWith('https://beta.music.apple.com/')) {
                let target = convertLinkToAPI(msgArgs);
                let apiToken = await fetch("https://api.cider.sh/v1", { headers: { "User-Agent": "Cider" } });
                apiToken = await apiToken.json();
                let appleMusic = await fetch(target.url, { headers: { "Authorization": "Bearer " + apiToken.token } });
                appleMusic = await appleMusic.json();

                if (target.kind === 'album' || target.kind === 'playlist') {
                    await interaction.reply(`Added *${appleMusic.data.length}* tracks to the queue`)
                    for (let track of appleMusic.data) {
                        const searchedSongs = await SongSearcher.search(`${track.attributes.name} by ${track.attributes.artistName} (Audio)`, { maxResults: 10 });
                        track = searchedSongs[0].url;
                        await addToQueue(interaction, musicordPlayer, msgMember, track);
                    }
                }
                else if (target.kind === 'song') {
                    const track = appleMusic.data[0];
                    const searchedSongs = await SongSearcher.search(`${track.attributes.name} by ${track.attributes.artistName} (Audio)`, { maxResults: 10 });
                    msgArgs = searchedSongs[0].url;
                    await addToQueue(interaction, musicordPlayer, msgMember, msgArgs);
                }
            }
            else if(msgArgs.startsWith('https://youtube.com/')) {
                await addToQueue(interaction, musicordPlayer, msgMember, msgArgs);
            }
            else {
                await interaction.reply('Sorry, I can only play links from Apple Music and YouTube for now');
            }
        }
        else {
            interaction.reply(`${interaction.user} You need to be in a voice channel to use this command!`);
        }
    }
}

const convertLinkToAPI = (link) => {
    let catalog = link.split('/')[3];
    let kind = link.split('/')[4];
    let albumId = link.split('/')[6];
    let songId = link.split('=')[1];
    if (kind === 'album') {
        if (songId) {
            return { url: `https://api.music.apple.com/v1/catalog/${catalog}/songs/${songId}`, kind: 'song' }
        }
        return { url: `https://api.music.apple.com/v1/catalog/${catalog}/albums/${albumId}/tracks`, kind: 'album' };
    }
    else if (kind === 'playlist') {
        return { url: `https://api.music.apple.com/v1/catalog/${catalog}/playlists/${albumId}/tracks`, kind: 'playlist' };
    }
}

const addToQueue = async (interaction, musicordPlayer, msgMember, song) => {
    if (musicordPlayer.existQueue(interaction.guild)) {
        const queue = musicordPlayer.getQueue(interaction.guild);
        if (queue) await queue.play(song, msgMember.voice.channel);
        const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
        if (queueInfo && queue) interaction.followUp(`${queueInfo.songs[queueInfo.songs.length - 1].title} has been added to the queue`)
    } else {
        const queue = musicordPlayer.initQueue(interaction.guild, {
            textChannel: interaction.channel,
            voiceChannel: msgMember.voice.channel

        });
        queue.setBitrate(256000);
        if (queue) {
            interaction.deferReply();
            // queue.setFilter(AudioFilters.customEqualizer({
            //    band1: 99, // 20
            //    band2: 45, // 50
            //    band3: 54, // 94.82
            //    band4: 53, // 200
            //    band5: 52, // 500
            //    band6: 51, // 1000
            //    band7: 50, // 2000
            //    band8: 49, // 5000
            //    band9: 48, // 10000
            //    band10: 47, // 20000
            // }));
            await queue.play(song, msgMember.voice.channel)
        }
        const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
        if (queueInfo) return await interaction.editReply(`Playing ${queueInfo.songs[0].title}`)
    }
}