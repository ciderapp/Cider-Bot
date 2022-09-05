import { SlashCommandBuilder, resolveColor, AttachmentBuilder } from 'discord.js';
import { getArtwork } from '../../integrations/musickitAPI.js';
import { CiderPOST as CiderHeader } from '../../data/headers.js';
import m3u8 from 'm3u8-stream-list'
import { exec } from 'child_process';
import { unlinkSync } from 'fs';
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
            .setRequired(false))
        .addBooleanOption(o => o.setName("animated-artwork")
            .setDescription("Include the animated artwork in the embed (if available)")
            .setRequired(false)),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        let amAPIToken = client.amAPIToken;
        let query = interaction.options.getString('query');
        let includeInfo = interaction.options.getBoolean('include-info') || false;
        let animatedArtwork = interaction.options.getBoolean('animated-artwork') || false;
        if (query && !query.startsWith('https://')) {
            query = `/v1/catalog/us/search/?term=${query.replace(/ /g, '+')}&with=topResults&types=activities,albums,apple-curators,artists,curators,music-videos,playlists,record-labels,songs,stations`;
        } else if (!query.startsWith('https://music.apple.com/') && !query.startsWith('https://beta.music.apple.com/')) return await interaction.reply({ content: ' We only support apple music links and normal queries', ephemeral: true });
        await interaction.reply({ content: 'Getting artwork from Apple Music' });
        let res = await getArtwork(amAPIToken, query, animatedArtwork).catch((err) => {
            consola.error(err);
            if (err.name === "TypeError") return interaction.editReply({
                content: '', embeds: [{
                    color: resolveColor('Red'),
                    author: { name: `${client.user.username} | Search Error`, iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671' },
                    description: `We cannot find an artwork that matches your query:\n\`${interaction.options.getString('query')}\``,
                    footer: { text: `requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }
                }]
            })
            return interaction.editReply({ content: `An error occured while getting the artwork: \`${err}\`` });
        });
        if (animatedArtwork && res.attributes?.editorialVideo) {
            await interaction.editReply({ content: 'Converting animated artwork...' });
            if (includeInfo) {
                await interaction.editReply({
                    content: '', embeds: [{
                        color: resolveColor(`#${res.attributes.artwork.bgColor}`),
                        title: res.attributes.name,
                        description: `${res.attributes.artistName ? `by **${res.attributes.artistName}**` : ""} ${res.attributes.albumName ? `on **${res.attributes.albumName}**` : ""}\nKind: **${res.type.slice(0, -1)}**`,
                        url: res.attributes.url
                    }]
                });
            }
            if (res.type === "artists") res.attributes.editorialVideo.motionDetailSquare = res.attributes.editorialVideo.motionArtistSquare1x1;
            let playlist = await fetch(res.attributes.editorialVideo.motionDetailSquare.video)
            playlist = Buffer.from(await playlist.arrayBuffer())
            let videos = m3u8(playlist).filter(v => v.CODECS.includes('avc1') && v.RESOLUTION == '1080x1080')
            if(!includeInfo) await interaction.editReply({ content: videos[videos.length -1].url.replace('-.m3u8', "-.mp4").replace('.m3u8', '-.mp4') })
            else await interaction.followUp({ content: videos[videos.length -1].url.replace('-.m3u8', "-.mp4").replace('.m3u8', '-.mp4') }) 
        }
        else {
            if (animatedArtwork && !res.attributes?.editorialVideo) {
                return await interaction.followUp({ content: 'Sorry, We cannot find an animated artwork for your query' });
            }
            if (!res) return await interaction.editReply({ content: `No artwork found for \`${query}\`` });
            if (!includeInfo) {
                return await interaction.editReply(res.attributes.artwork.url.replace('{w}', res.attributes.artwork.width).replace('{h}', res.attributes.artwork.height));
            }


            return await interaction.editReply({
                content: '',
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
}