import { SlashCommandBuilder, resolveColor, AttachmentBuilder } from 'discord.js';
import { getArtwork } from '../../integrations/musickitAPI.js';
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
        if (animatedArtwork && res.attributes.editorialVideo) {
            await interaction.editReply({ content: 'Converting animated artwork...' });
            if(includeInfo) {
                await interaction.editReply({
                    content: 'Converting your artwork...', embeds: [{
                        color: resolveColor(`#${res.attributes.artwork.bgColor}`),
                        title: res.attributes.name,
                        description: `${res.attributes.artistName ? `by **${res.attributes.artistName}**` : ""} ${res.attributes.albumName ? `on **${res.attributes.albumName}**` : ""}\nKind: **${res.type.slice(0, -1)}**`,
                        url: res.attributes.url
                    }]
                });
            }
            if (res.type === "artists") res.attributes.editorialVideo.motionDetailSquare = res.attributes.editorialVideo.motionArtistSquare1x1;
            exec(`yt-dlp ${res.attributes.editorialVideo.motionDetailSquare.video} -S "codec:h264,res:960" -o "temp.mp4" && ffmpeg -y -i temp.mp4 artwork.mp4`, async (err, stdout, stderr) => {
                if (err) return console.error(err)
                consola.info(stdout)
                consola.info(stderr)
                unlinkSync('temp.mp4');
                await interaction.editReply({
                    content: '',
                    files: [
                        new AttachmentBuilder().setFile('artwork.mp4').setName('artwork.mp4')
                    ]
                })
            })
        }
        else {
            if(animatedArtwork && !res.attributes.editorialVideo) {
                await interaction.followUp({ content: 'Sorry, We cannot find an animated artwork for your query' });
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