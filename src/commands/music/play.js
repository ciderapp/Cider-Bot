import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { default as pm } from 'pretty-ms';
import { QueryType } from 'discord-player';
import { stream } from 'play-dl'
import 'dotenv/config';

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
        if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        if (interaction.guildId == process.env.guildId && !interaction.channelId == "843954941827481670") return await interaction.reply({ content: "This command can only be used in the <#843954941827481670> channel!", ephemeral: true });
        let query = interaction.options.get('query').value;
        // Create Queue
        const queue = player.createQueue(interaction.guild, {
            metadata: {
                channel: interaction.channel,
                voteskip: 0,
                votestop: 0,
            },
            async onBeforeCreateStream(track, source, _queue) {
                // only trap youtube source
                if (source === "youtube") {
                    // track here would be youtube track
                    return (await stream(track.url, { discordPlayerCompatibility: true })).stream;
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
            await interaction.reply(`Connecting to Apple Music API...`);
            let arraySongs = [];
            await getAppleMusicData(query, arraySongs, amAPIToken);
            consola.info(query);
            if (arraySongs.length > 1) {
                let playName = await getAppleMusicPlaylistName(query, amAPIToken)
                await interaction.editReply(`Adding **${playName}** with \`${arraySongs.length}\` tracks to the queue`)
                let i = 1;
                for (let song of arraySongs) {
                    const track = await player.search(`${song.name} by ${song.artistName} (Audio)`, { requestedBy: interaction.user }).then(x => x.tracks[0]);
                    if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
                    if (queue.nowPlaying() == null) await queue.play(track);
                    else queue.addTrack(track);
                    await interaction.editReply(`Added **${song.name} by ${song.artistName}** to the queue (${i}/${arraySongs.length})`);
                    i++;
                }
                await interaction.editReply(`Added \`${arraySongs.length}\` tracks from **${playName}** to the queue`)
            } else if (arraySongs.length === 1) {
                await interaction.editReply(`Parsing \`${arraySongs[0].name} by ${arraySongs[0].artistName}\` from Apple Music...`)
                const track = await player.search(`${arraySongs[0].name} by ${arraySongs[0].artistName} (Audio)`, { requestedBy: interaction.user }).then(x => x.tracks[0]);
                if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
                if (queue.nowPlaying() == null) await queue.play(track);
                else queue.addTrack(track);
                await interaction.editReply(`Added **${arraySongs[0].name} by ${arraySongs[0].artistName}** to the queue`);

            }
        } else if (query.startsWith('https://www.youtube.com/') || query.startsWith('https://music.youtube.com/')) {
            await interaction.reply(`Parsing \`${query}\` from YouTube`);

            const searchResult = await player.search(query, { requestedBy: interaction.user, searchEngine: QueryType.AUTO })
            if (!searchResult) return await interaction.followUp({ content: `❌ | Cannot find \`${query}\` in youtube` });
            await interaction.editReply(`Adding ${searchResult.playlist ? `**${searchResult.playlist.title}** with \`${searchResult.tracks.length}\` tracks to the queue` : `**${searchResult.tracks[0].title}** to the queue`}`)
            if (queue.nowPlaying() == null) {
                if (searchResult.playlist) queue.addTracks(searchResult.tracks);
                else queue.addTrack(searchResult.tracks[0])
                await queue.play();
            }
            else queue.addTrack(searchResult.tracks);
            if (!searchResult.playlist) await interaction.editReply(`Added **${searchResult.tracks[0].title}** to the queue`);
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
    let appleMusic = await fetch(href, { headers: { "Authorization": "Bearer " + amAPIToken } });
    appleMusic = await appleMusic.json();
    for (song of appleMusic.data) {
        arraySongs.push(song.attributes);
    }
    if (appleMusic.next) {
        console.log(appleMusic.next);
        await getAppleMusicData(appleMusic.next, arraySongs, amAPIToken);
    }
}
async function getAppleMusicPlaylistName(link, amAPIToken) {
    let kind;
    if (link.startsWith('https://music.apple.com/')) {
        link = await convertLinkToAPI(link);
        link.kind;
        link = link.url;
    }
    const href = `https://api.music.apple.com${link.replace('/tracks', '')}`;
    let appleMusic = await fetch(href, { headers: { "Authorization": "Bearer " + amAPIToken } });
    appleMusic = await appleMusic.json();
    if (kind === 'album') {
        return `${appleMusic.data.attributes.name} by ${appleMusic.data.attributes.artistName}`;
    }
    return appleMusic.data[0].attributes.name;
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