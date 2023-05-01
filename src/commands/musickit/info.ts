import { SlashCommandBuilder, EmbedBuilder, resolveColor, ChatInputCommandInteraction } from 'discord.js';
import { getInfo } from '../../integrations/musickitAPI.js';
import consola from 'consola';

export const command = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('searches apple music for your query and returns the info')
        .addStringOption((o) => o.setName('query').setDescription('The song/artist to get the artwork of (works with apple music links and normal queries only)').setRequired(true))
        .addStringOption((o) => o.setName('storefront').setDescription("Override the storefront to search in (defaults to 'us')").setRequired(false)),
    category: 'MusicKit',
    execute: async (interaction: ChatInputCommandInteraction) => {
        let client = interaction.client;
        let amAPIToken = client.amAPIToken;
        let query: string | URL = interaction.options.getString('query') || '';
        let storefront = interaction.options.getString('storefront') || 'us';
        let failed = false;

        if (query && !query.startsWith('https://')) {
            let href = new URL(`v1/catalog/${storefront}/search/`, 'https://api.music.apple.com/');
            href.searchParams.set('term', query);
            href.searchParams.set('platform', 'web');
            href.searchParams.set('types', 'activities,albums,apple-curators,artists,curators,editorial-items,music-movies,music-videos,playlists,songs,stations,tv-episodes,uploaded-videos,record-labels');
            href.searchParams.set('limit', '1');
            href.searchParams.set('with', 'serverBubbles,lyricHighlights');
            href.searchParams.set('omit[resource]', 'autos');
            query = href.pathname + href.search;
        } else if (!query.startsWith('https://music.apple.com/') && !query.startsWith('https://beta.music.apple.com/')) return await interaction.reply({ content: ' We only support apple music links and normal queries', ephemeral: true });
        await interaction.reply({ content: 'Getting artwork from Apple Music' });

        let info = await getInfo(amAPIToken, query).catch(async (err) => {
            consola.error(err);
            failed = true;
            if (err.name === 'TypeError')
                return interaction.editReply({
                    content: '',
                    embeds: [
                        {
                            color: resolveColor('Red'),
                            author: { name: `${client.user.username} | Search Error`, icon_url: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671' },
                            description: `We cannot find the info that matches your query:\n\`${interaction.options.getString('query')}\``,
                            footer: { text: `requested by ${interaction.user.tag}`, icon_url: interaction.user.displayAvatarURL() }
                        }
                    ]
                });
            return interaction.editReply({ content: `An error occured while getting the info: \`${err}\`` });
        });
        if (!info) return await interaction.editReply({ content: 'Failed to get info from Apple Music' });
        let embed = new EmbedBuilder()
            .setAuthor({
                name: `${client.user.username} | ${info.type.slice(0, 1).toUpperCase()}${info.type.slice(1, -1)} Info`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle(info.attributes.name)
            .setURL(info.attributes.url)
            .setThumbnail(info.attributes.artwork.url.replace('{w}', info.attributes.artwork.width).replace('{h}', info.attributes.artwork.height))
            .setColor(resolveColor(`#${info.attributes.artwork.bgColor}`))
            .setFooter({ text: `requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL()});
        if (info.type === 'apple-curators') embed.setDescription(info.attributes.editorialNotes.standard.split('\n')[0]);
        else if (info.attributes.editorialNotes) embed.setDescription(info.attributes.editorialNotes.short);
        if (info.attributes.artistName) embed.addFields({ name: 'Artist', value: info.attributes.artistName, inline: true });
        if (info.attributes.albumName) embed.addFields({ name: 'Album', value: info.attributes.albumName, inline: true });
        if (info.attributes.genreNames) embed.addFields({ name: 'Genre', value: info.attributes.genreNames.join(', '), inline: true });
        if (info.attributes.releaseDate) embed.addFields({ name: 'Release Date', value: `<t:${Date.parse(info.attributes.releaseDate) / 1000}:D>`, inline: true });
        if (info.attributes.recordLabel) embed.addFields({ name: 'Record Label', value: info.attributes.recordLabel, inline: true });
        if (info.attributes.durationInMillis) embed.addFields({ name: 'Duration', value: msToTime(info.attributes.durationInMillis), inline: true });
        if (info.attributes.isrc) embed.addFields({ name: 'ISRC', value: info.attributes.isrc, inline: true });
        if (info.attributes.audioTraits?.length > 0) embed.addFields({ name: 'Audio Traits', value: info.attributes.audioTraits.join(', '), inline: true });
        if (info.attributes.trackNumber != null) embed.addFields({ name: 'Track Number', value: `${info.attributes.trackNumber}`, inline: true });
        if (info.attributes.lastModifiedDate) embed.addFields({ name: 'Last Modified', value: `<t:${Date.parse(`${info.attributes.lastModifiedDate}`) / 1000}:f>`, inline: true });
        if (info.attributes.playlistType) embed.addFields({ name: 'Playlist Type', value: info.attributes.playlistType, inline: true });
        if (info.attributes.curatorName) embed.addFields({ name: 'Curator', value: info.attributes.curatorName, inline: true });
        if (info.attributes.trackCount != null) embed.addFields({ name: 'Tracks', value: `${info.attributes.trackCount}`, inline: true });
        await interaction.editReply({ content: '', embeds: [embed] });
    }
};
function msToTime(ms: number) {
    let secs = Math.floor(ms / 1000);
    ms %= 1000;
    let mins = Math.floor(secs / 60);
    secs %= 60;
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  }
