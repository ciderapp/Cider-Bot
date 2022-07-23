import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import consola from 'consola';
import { default as pm } from 'pretty-ms';
export const interaction = {
    data: { name: 'queuePages' },
    async execute(interaction) {
        let { client } = await import('../index.js');
        let pageNumber = interaction.customId.split('|')[1];
        consola.info("Navigation to page ", pageNumber);
        const musicordPlayer = client.musicordPlayer;
        const queue = musicordPlayer.getQueue(interaction.guild);
        if (!queue.isPlaying) return await interaction.reply({ content: 'There is no song playing currently!', ephemeral: true });
        let songlist = queue.getSongs();
        let totalTime = 0;
        songlist.forEach(track => {
            totalTime += track.msDuration;
        });
        let queueEmbed = await interaction.update({
            embeds: [new EmbedBuilder()
                .setTitle(`Song Queue for ${interaction.guild.name} ${songlist.length > 20 ? `(${pageNumber}/${Math.floor(songlist.length / 20) + 1})` : ''}`)
                .setAuthor({
                    name: `${interaction.client.user.username} | Queue`,
                    iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
                })
                .setDescription(`${songlist.slice((+pageNumber - 1) * 20, +pageNumber * 20).map((song, i) => `${i + ((+pageNumber-1) * 20) == 0 ? ':arrow_forward: ' : `[${i + ((pageNumber-1) * 20)}] `} **${song.title}** - ${song.duration} ${i + ((pageNumber-1) * 20) == 0 ? '\n' : ''}`).join('\n')}`)
                .setColor(0xf21f52)
                .setThumbnail(`${interaction.guild.iconURL({ dynamic: true })}`)
                .setFooter({ text: `${songlist.length} Tracks | Queue Time: ${pm(totalTime, { verbose: true })}` },)
            ],
            components: [new ActionRowBuilder().addComponents(
                songlist.length > 20 ? new ButtonBuilder().setEmoji('⏪').setStyle(ButtonStyle.Secondary).setCustomId(`queuePages|${+pageNumber - 1 == 0 ? Math.floor(songlist.length / 20 + 1) : +pageNumber - 1}`) : null,
                songlist.length > 20 ? new ButtonBuilder().setEmoji('⏩').setStyle(ButtonStyle.Secondary).setCustomId(`queuePages|${+pageNumber + 1 > Math.floor(songlist.length / 20 + 1) ? 1 : +pageNumber + 1}`) : null
            )],
            fetchReply: true
        });
    }
}