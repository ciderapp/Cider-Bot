import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicKit as MusicKitHeader } from '../../data/headers.js';
import fetch from 'node-fetch';
import { QueryType } from 'discord-player';
import { stream } from 'play-dl'
import { searchMusics } from 'node-youtube-music';
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
        if (interaction.guildId == process.env.guildId && interaction.channelId != "843954941827481670") return await interaction.reply({ content: "This command can only be used in the <#843954941827481670> channel!", ephemeral: true });
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
            if (!queue.connection) {
                console.log("Joinable:", interaction.member.voice.channel.joinable);
                if(!interaction.member.voice.channel.joinable) {
                    queue.destroy();
                    return await interaction.reply({ content: "I don't have permission to join your voice channel!", ephemeral: true });
                }
                console.log('Creating connection...');
                await queue.connect(interaction.member.voice.channel);
                queue.setVolume(50);
            } 
        } catch {
            queue.destroy();
            return await interaction.reply({ content: "Could not join your voice channel!", ephemeral: true });
        }
        // Convert Query links

        if (!query.startsWith('https://')) {
            await interaction.reply(`Searching for ${query}`);
            const link = "https://www.youtube.com/watch?v=" + (await searchMusics(query))[0].youtubeId;
            const track = await player.search(query, { requestedBy: interaction.user }).then(x => x.tracks[0]);
            if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
            track.description = `Requested by <@${interaction.user.id}>`;
            await interaction.editReply(`Added **${track.title}** to the queue`);
            if (queue.nowPlaying() == null) await queue.play(track, {immediate: true});
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
                    consola.info(song)
                    const link = "https://www.youtube.com/watch?v=" + (await searchMusics(`${song.name} by ${song.artistName}`))[0].youtubeId;
                    const track = await player.search(link, { requestedBy: interaction.user }).then(x => x.tracks[0]);
                    if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
                    track.author = song.artistName;
                    track.title = song.name;
                    track.views = song.url;
                    track.description = `${song.name} by ${song.artistName} on Apple Music. ${song.releaseDate.split('-')[0]}. Requested by <@${interaction.user.id}>`;
                    track.thumbnail = song.artwork.url.replace('{w}', song.artwork.width).replace('{h}', song.artwork.height)
                    if (queue.nowPlaying() == null) await queue.play(track,  {immediate: true});
                    else queue.addTrack(track);
                    await interaction.editReply(`Added **${song.name} by ${song.artistName}** to the queue (${i}/${arraySongs.length})`);
                    i++;
                }
                await interaction.editReply(`Added \`${arraySongs.length}\` tracks from **${playName}** to the queue`)
            } else if (arraySongs.length === 1) {
                await interaction.editReply(`Parsing \`${arraySongs[0].name} by ${arraySongs[0].artistName}\` from Apple Music...`)
                const link = "https://www.youtube.com/watch?v=" + (await searchMusics(`${arraySongs[0].name} by ${arraySongs[0].artistName}`))[0].youtubeId;
                const track = await player.search(link, { requestedBy: interaction.user }).then(x => x.tracks[0]);
                console.log("Playing:",track);
                if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
                track.author = arraySongs[0].artistName;
                track.title = arraySongs[0].name;
                track.views = arraySongs[0].url;
                track.description = `${arraySongs[0].name} by ${arraySongs[0].artistName} on Apple Music. ${arraySongs[0].releaseDate.split('-')[0]}. Requested by <@${interaction.user.id}>`;
                track.thumbnail = arraySongs[0].artwork.url.replace('{w}', arraySongs[0].artwork.width).replace('{h}', arraySongs[0].artwork.height)
                if (queue.nowPlaying() == null) await queue.play(track,  {immediate: true});
                else queue.addTrack(track);
                await interaction.editReply(`Added **${arraySongs[0].name} by ${arraySongs[0].artistName}** to the queue`);

            }
        } else if (query.startsWith('https://www.youtube.com/') || query.startsWith('https://music.youtube.com/')) {
            await interaction.reply(`Parsing \`${query}\` from YouTube`);

            const searchResult = await player.search(query, { requestedBy: interaction.user, searchEngine: QueryType.AUTO })
            if (!searchResult) return await interaction.followUp({ content: `❌ | Cannot find \`${query}\` in youtube` });
            await interaction.editReply(`Adding ${searchResult.playlist ? `**${searchResult.playlist.title}** with \`${searchResult.tracks.length}\` tracks to the queue` : `**${searchResult.tracks[0].title}** to the queue`}`)
            searchResult.tracks.forEach(track => {
                track.description = `Requested by <@${interaction.user.id}>`;
            });
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
    let appleMusic = await fetch(href, { headers: MusicKitHeader(amAPIToken) });
    appleMusic = await appleMusic.json();
    consola.info(appleMusic);
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
    let appleMusic = await fetch(href, { headers: MusicKitHeader(amAPIToken) });
    appleMusic = await appleMusic.json();
    if (kind === 'album') {
        return `${appleMusic.data.attributes.name} by ${appleMusic.data.attributes.artistName}`;
    }
    return appleMusic.data[0].attributes.name;
}

// write something that will make me cry
