import { SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

export const command = {
    data: new SlashCommandBuilder()
        .setName("playnext")
        .setDescription("Queue a song to play next")
        .addStringOption(option => option.setName("query")
            .setDescription("The song to play next!")
            .setRequired(true)
        ),
    category: 'Music',
    execute: async (interaction) => {
        let components = [];
        let { client } = await import('../../index.js');
        const player = client.player;
        const queue = player.getQueue(interaction.guild);
        let amAPIToken = client.amAPIToken;
        if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        if (interaction.guildId == process.env.guildId && interaction.channelId != "843954941827481670") return await interaction.reply({ content: "This command can only be used in the <#843954941827481670> channel!", ephemeral: true });
        let query = interaction.options.get('query').value;
        if (!query.startsWith('https://')) { // if not a link
            await interaction.reply(`Searching for ${query}`);
            const track = await player.search(query, { requestedBy: interaction.user }).then(x => x.tracks[0]);
            if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
            track.description = `Requested by <@${interaction.user.id}>`;
            await interaction.editReply(`Added **${track.title}** to the start of the queue`);
            if (queue.nowPlaying() == null) await queue.play(track);
            else queue.insert(track);
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
                    track.author = arraySongs[0].artistName;
                    track.title = arraySongs[0].name;
                    track.views = arraySongs[0].url;
                    track.description = `${song.name} by ${song.artistName} on Apple Music. ${song.releaseDate.split('-')[0]}. Requested by <@${interaction.user.id}>`;
                    track.thumbnail = arraySongs[0].artwork.url.replace('{w}', arraySongs[0].artwork.width).replace('{h}', arraySongs[0].artwork.height)
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
                track.author = song.artistName;
                track.title = song.name;
                track.views = song.url;
                track.description = `${arraySongs[0].name} by ${arraySongs[0].artistName} on Apple Music. ${arraySongs[0].releaseDate.split('-')[0]}. Requested by <@${interaction.user.id}>`;
                if (queue.nowPlaying() == null) await queue.play(track);
                else queue.insert(track);
                await interaction.editReply(`Added **${arraySongs[0].name} by ${arraySongs[0].artistName}** to the start of the queue`);

            }
        } else if (query.startsWith('https://www.youtube.com/') || query.startsWith('https://music.youtube.com/')) {
            await interaction.reply(`Parsing \`${query}\` from YouTube`);

            const searchResult = await player.search(query, { requestedBy: interaction.user, searchEngine: QueryType.AUTO })
            if (!searchResult) return await interaction.followUp({ content: `❌ | Cannot find \`${query}\` in youtube` });
            await interaction.editReply(`Adding ${searchResult.playlist ? `**${searchResult.playlist.title}** with \`${searchResult.tracks.length}\` tracks to the start of the queue` : `**${searchResult.tracks[0].title}** to the start of the queue`}`)
            searchResult.tracks.forEach(track => {
                track.description = `Requested by <@${interaction.user.id}>`;
            });
            if (queue.nowPlaying() == null) {
                if (searchResult.playlist) queue.addTracks(searchResult.tracks);
                else queue.insert(searchResult.tracks[0])
                await queue.play();
            }
            else queue.addTrack(searchResult.tracks);
            if (!searchResult.playlist) await interaction.editReply(`Added **${searchResult.tracks[0].title}** to the start of the queue`);
        } else { await interaction.reply('Sorry, I can only play links from Apple Music and YouTube for now'); }
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
    if (link.startsWith('https://music.apple.com/')) {
        link = await convertLinkToAPI(link);
        let kind = link.kind;
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