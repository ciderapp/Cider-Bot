import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { default as pm } from 'pretty-ms';
import { QueryType } from 'discord-player';
import { stream } from 'play-dl'
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
        let { client } = await import('../../index.js');
        const player = client.player;
        let amAPIToken = client.amAPIToken;



        if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if (interaction.guild.me?.voice?.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        let query = interaction.options.get('query').value;
        // Create Queue
        const queue = player.createQueue(interaction.guild, {
            metadata: {
                channel: interaction.channel
            },
            async onBeforeCreateStream(track, source, _queue) {
                // only trap youtube source
                if (source === "youtube") {
                    // track here would be youtube track
                    return (await stream(track.url, { discordPlayerCompatibility : true })).stream;
                    // we must return readable stream or void (returning void means telling discord-player to look for default extractor)
                }
            }
        });
        // verify vc connection
        try {
            if (!queue.connection) await queue.connect(interaction.member.voice.channel);
        } catch {
            queue.destroy();
            return await interaction.reply({ content: "Could not join your voice channel!", ephemeral: true });
        }
        // await interaction.deferReply();
        // Convert Query links

        if (!query.startsWith('https://')) { // if not a link
            await interaction.reply(`Searching for ${query}`);
            const track = await player.search(query, { requestedBy: interaction.user }).then(x => x.tracks[0]);
            if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
            if (queue.nowPlaying() == null) await queue.play(track);
            else queue.addTrack(track);
        } else if (query.startsWith('https://music.apple.com/') || query.startsWith('https://beta.music.apple.com/')) { // if link is apple music
            let arraySongs = [];
            await getAppleMusicData(query, arraySongs, amAPIToken);
            if (arraySongs.length > 1) {

                await interaction.reply(`Adding *${arraySongs.length}* tracks to the queue`)
                for (let song of arraySongs) {
                    consola.info(queue.nowPlaying() == null);
                    const track = await player.search(`${song.name} by ${song.artistName} (Audio)`, { requestedBy: interaction.user }).then(x => x.tracks[0]);
                    if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });

                    if (queue.nowPlaying() == null) await queue.play(track);
                    else queue.addTrack(track);
                    await interaction.editReply(`Added **${song.name} by ${song.artistName}** to the queue`);
                }
                await interaction.editReply(`Added *${arraySongs.length}* tracks to the queue`)
            } else if (arraySongs.length === 1) {
                await interaction.reply(`Parsing \`${arraySongs[0].name} by ${arraySongs[0].artistName} \` from Apple Music...`)
                const track = await player.search(`${arraySongs[0].name} by ${arraySongs[0].artistName} (Audio)`, { requestedBy: interaction.user }).then(x => x.tracks[0]);
                if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
                if (queue.nowPlaying() == null) await queue.play(track);
                else queue.addTrack(track);
                await interaction.editReply(`Added **${arraySongs[0].name} by ${arraySongs[0].artistName}** to the queue`);

            }
        } else if (query.startsWith('https://www.youtube.com/')) {
            await interaction.reply(`Getting song data from YouTube...`);
            const track = await player.search(query, { requestedBy: interaction.user, searchEngine: QueryType.AUTO }).then(x => x.tracks[0]);
            if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
            if (queue.nowPlaying() == null) await queue.play(track);
            else queue.addTrack(track);
            await interaction.reply(`Added **${track.title}** to the queue`);
        } else { await interaction.reply('Sorry, I can only play links from Apple Music and YouTube for now'); }
        // consola.success(queue.tracks);

    }

}

const convertLinkToAPI = async (link) => {
    let catalog = link.split('/')[3];
    let kind = link.split('/')[4];
    let albumId = link.split('/')[6];
    let songId = link.split('=')[1];
    if (kind === 'album') {
        if (songId) {
            return { url: `/v1/catalog/${catalog}/songs/${songId}`, kind: 'song' }
        }
        return { url: `/v1/catalog/${catalog}/albums/${albumId}/tracks`, kind: 'album' };
    }
    else if (kind === 'playlist') {
        return { url: `/v1/catalog/${catalog}/playlists/${albumId}/tracks`, kind: 'playlist' };
    }
}
async function getAppleMusicData(song, arraySongs, amAPIToken) {
    if (song.startsWith('https://music.apple.com/')) {
        song = (await convertLinkToAPI(song)).url;
    }
    const href = `https://api.music.apple.com${song}`;
    consola.info(amAPIToken);
    let appleMusic = await fetch(href, { headers: { "Authorization": "Bearer " + amAPIToken } });
    appleMusic = await appleMusic.json();
    console.log(appleMusic);
    for (song of appleMusic.data) {
        arraySongs.push(song.attributes);
    }
    if (appleMusic.next) {
        console.log(appleMusic.next);
        await getAppleMusicData(appleMusic.next, arraySongs, amAPIToken);
    }
}

// const addToQueue = async (interaction, musicordPlayer, msgMember, song) => {
//     let npInterval, npEmbed;
//     if (musicordPlayer.existQueue(interaction.guild)) {
//         const queue = musicordPlayer.getQueue(interaction.guild);
//         if (queue) queue.play(song, msgMember.voice.channel);
//         return song;

//     } else {
//         const queue = musicordPlayer.initQueue(interaction.guild, {
//             textChannel: interaction.channel,
//             voiceChannel: msgMember.voice.channel
//         });
//         const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
//         queue.on('trackStart', async (channel, song) => {
//             let slidebar = queue.generateSongSlideBar();
//             let color = await getColors(Buffer.from(await (await fetch(`https://i.ytimg.com/vi/${song.id}/maxresdefault.jpg`)).arrayBuffer()), 'image/jpeg');
//             npEmbed = await channel.send({
//                 content: `Playing **${song.title}** @ ${queueInfo.voiceChannel.bitrate / 1000}kbps`,
//                 embeds: [new EmbedBuilder()
//                     .setTitle(`${song.title}`)
//                     .setAuthor({
//                         name: `${interaction.client.user.username} | Now Playing`,
//                         iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
//                     })
//                     .setDescription(`${song.description}\n${pm(queueInfo.ressource.playbackDuration, { colonNotation: true }).split('.')[0]} ${slidebar} ${song.duration}`)
//                     .setColor(0xf21f52)
//                     .setThumbnail(`https://i.ytimg.com/vi/${song.id}/maxresdefault.jpg`)
//                     .setURL(`${song.url}`)
//                     .setFooter({ text: queueInfo.songs[1] != null ? `Next Track: ${queueInfo.songs[1].title}` : 'No more tracks in queue' })
//                 ]
//             });

//             npInterval = setInterval(async () => {
//                 slidebar = queue.generateSongSlideBar();
//                 await npEmbed.edit({
//                     content: `Playing **${song.title}** @ ${queueInfo.voiceChannel.bitrate / 1000}kbps`,
//                     embeds: [new EmbedBuilder()
//                         .setTitle(`${song.title}`)
//                         .setAuthor({
//                             name: `${interaction.client.user.username} | Now Playing`,
//                             iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
//                         })
//                         .setDescription(`${pm(queueInfo.ressource.playbackDuration, { colonNotation: true }).split('.')[0]} ${slidebar} ${song.duration}`)
//                         .setColor(color ? +(color[0].hex().replace('#', '0x')) : 0xf21f52)
//                         .setThumbnail(`https://i.ytimg.com/vi/${song.id}/maxresdefault.jpg`)
//                         .setURL(`${song.url}`)
//                         .setFooter({ text: queueInfo.songs[1] != null ? `Next Track: ${queueInfo.songs[1].title}` : 'No more tracks in queue' })
//                     ]
//                 })
//             }, 5000);
//         })
//         queue.on('trackFinished', async (guild, song) => {
//             clearInterval(npInterval);
//             await npEmbed.delete();
//         })
//         queue.on('stop', async (guild, song) => {
//             consola.info(`The queue in ${guild} has stopped, Leaving Voice Chat`);
//             clearInterval(npInterval);
//             await npEmbed.delete();
//         })
//         queue.on('pause', async (guild) => {
//             consola.info(`The queue in ${guild} has been paused`);
//         })
//         if (queue) {
//             // interaction.deferReply();
//             // queue.setFilter(AudioFilters.customEqualizer({
//             //    band1: 99, // 20
//             //    band2: 45, // 50
//             //    band3: 54, // 94.82
//             //    band4: 53, // 200
//             //    band5: 52, // 500
//             //    band6: 51, // 1000
//             //    band7: 50, // 2000
//             //    band8: 49, // 5000
//             //    band9: 48, // 10000
//             //    band10: 47, // 20000
//             // }));
//             await queue.play(song, msgMember.voice.channel)
//         }
//         // if (queueInfo) return await interaction.deleteReply();
//     }
// }