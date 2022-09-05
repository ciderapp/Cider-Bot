import { SlashCommandBuilder, EmbedBuilder, resolveColor } from 'discord.js';
import { getInfo } from '../../integrations/musickitAPI.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("searches apple music for your query and returns the info")
        .addStringOption(o => o.setName("query")
            .setDescription("The song/artist to get the artwork of (works with apple music links and normal queries only)")
            .setRequired(true))
        .addStringOption(o => o.setName("storefront")
            .setDescription("Override the storefront to search in (defaults to 'us')")
            .setRequired(false)),
    category: 'MusicKit',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        let amAPIToken = client.amAPIToken;
        let query = interaction.options.getString('query');
        let storefront = interaction.options.getString('storefront') || 'us';
        let failed = false

        if (query && !query.startsWith('https://')) {
            query = `/v1/catalog/${storefront}/search/?term=${query.replace(/ /g, '+')}&with=topResults&types=activities,albums,apple-curators,artists,curators,music-videos,playlists,record-labels,songs,stations`;
        } else if (!query.startsWith('https://music.apple.com/') && !query.startsWith('https://beta.music.apple.com/')) return await interaction.reply({ content: ' We only support apple music links and normal queries', ephemeral: true });
        await interaction.reply({ content: 'Getting info from Apple Music' });

        let info = await getInfo(amAPIToken, query, storefront).catch(async err => {
            consola.error(err);
            failed = true;
            if (err.name === "TypeError") return interaction.editReply({
                content: '', embeds: [{
                    color: resolveColor('Red'),
                    author: { name: `${client.user.username} | Search Error`, iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671' },
                    description: `We cannot find the info that matches your query:\n\`${interaction.options.getString('query')}\``,
                    footer: { text: `requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }
                }]
            })
            return interaction.editReply({ content: `An error occured while getting the info: \`${err}\`` });

        });
        if (!info) return await interaction.editReply({ content: 'Failed to get info from Apple Music' });
        let embed = new EmbedBuilder()
            .setAuthor({ name: `${client.user.username} | ${info.type.slice(0,1).toUpperCase()}${info.type.slice(1, -1)} Info`, iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671' })
            .setTitle(info.attributes.name)
            .setURL(info.attributes.url)
            .setThumbnail(info.attributes.artwork.url.replace('{w}', info.attributes.artwork.width).replace('{h}', info.attributes.artwork.height))
            .setColor(resolveColor(`#${info.attributes.artwork.bgColor}`))
            .setFooter({ text: `requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        if (info.attributes.editorialNotes) embed.setDescription(info.attributes.editorialNotes.short);
        if (info.attributes.artistName) embed.addFields({ name: 'Artist', value: info.attributes.artistName, inline: true });
        if (info.attributes.albumName) embed.addFields({ name: 'Album', value: info.attributes.albumName, inline: true });
        if (info.attributes.genreNames) embed.addFields({ name: 'Genre', value: info.attributes.genreNames.join(', '), inline: true });
        if (info.attributes.releaseDate) embed.addFields({ name: 'Release Date', value: `<t:${Date.parse(info.attributes.releaseDate)/1000}:D>`, inline: true });
        if (info.attributes.recordLabel) embed.addFields({ name: 'Record Label', value: info.attributes.recordLabel, inline: true });
        if (info.attributes.durationInMillis) embed.addFields({ name: 'Duration', value: `${Math.floor(info.attributes.durationInMillis / 60000)}:${Math.floor((info.attributes.durationInMillis % 60000) / 1000)}`, inline: true });
        if (info.attributes.isrc) embed.addFields({ name: 'ISRC', value: info.attributes.isrc, inline: true });
        if (info.attributes.audioTraits?.length > 0) embed.addFields({ name: 'Audio Traits', value: info.attributes.audioTraits.join(', '), inline: true });
        if (info.attributes.trackNumber != null) embed.addFields({ name: 'Track Number', value: `${info.attributes.trackNumber}`, inline: true });
        if (info.attributes.lastModifiedDate) embed.addFields({ name: 'Last Modified', value: `<t:${Date.parse(`${info.attributes.lastModifiedDate}`)/1000}:f>`, inline: true });
        if (info.attributes.playlistType) embed.addFields({ name: 'Playlist Type', value: info.attributes.playlistType, inline: true });
        if (info.attributes.curatorName) embed.addFields({ name: 'Curator', value: info.attributes.curatorName, inline: true });
        if (info.attributes.recordLabel) embed.addFields({ name: 'Record Label', value: info.attributes.recordLabel, inline: true });
        if (info.attributes.trackCount != null) embed.addFields({ name: 'Tracks', value: `${info.attributes.trackCount}`, inline: true });
        await interaction.editReply({ content: '', embeds: [embed] });
    }
}