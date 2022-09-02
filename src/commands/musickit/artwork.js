import { SlashCommandBuilder, EmbedBuilder, resolveColor } from 'discord.js';
import { getArtwork } from '../../integrations/musickitAPI.js';
import 'dotenv/config';

export const command = {
    data: new SlashCommandBuilder()
        .setName("artwork")
        .setDescription("gives you artwork from apple music, provided the query")
        .addStringOption(o => o.setName("query")
            .setDescription("The song/artist to get the artwork of (works with apple music links and normal queries only)")
            .setRequired(true))
        .addBooleanOption(o => o.setName("include-info")
            .setDescription("Include the song/abum/artist info in the embed")
            .setRequired(false)),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        let amAPIToken = client.amAPIToken;
        let query = interaction.options.getString('query');
        let includeInfo = interaction.options.getBoolean('include-info') || false;
        if (query && !query.startsWith('https://')) {
            query = `/v1/catalog/us/search/?term=${query.replace(' ', '+')}&with=topResults`;
        }
        await interaction.reply({ content: 'Getting artwork from Apple Music' });
        let res = await getArtwork(amAPIToken, query);
        if (!includeInfo) {
            return await interaction.editReply(res);
        }
        return await interaction.editReply({
            embeds: [{
                color: resolveColor(`#${res.attributes.artwork.bgColor}`),
                title: res.attributes.name,
                description: `${res.attributes.artistName ? `by **${res.attributes.artistName}**` : ""} ${res.attributes.albumName ? `on **${res.attributes.albumName}**` : ""}\nKind: **${res.type.slice(0, -1)}**`,
                image: { url: res.attributes.artwork.url.replace('{w}', res.attributes.artwork.width).replace('{h}', res.attributes.artwork.height) },
                url: res.attributes.url
            }]
        });




    }
}