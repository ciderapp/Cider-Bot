import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import consola from 'consola';
import { default as pm } from 'pretty-ms';
export const interaction = {
    data: { name: 'queuePages' },
    async execute(interaction) {
        let { client } = await import('../index.js');
        const player = client.player;
        const queue = player.getQueue(interaction.guild);
        if (!queue) return await interaction.reply({ content: 'There is no song playing currently!', ephemeral: true });
        let pageNumber = interaction.customId.split('|')[1];
        consola.info("Navigated to page " + pageNumber);
        await interaction.update({
            embeds: [new EmbedBuilder()
                .setTitle(`Song Queue for ${interaction.guild.name} ${queue.tracks.length > 20 ? `(${pageNumber}/${Math.floor(queue.tracks.length / 20) + 1})` : ''}`)
                .setAuthor({
                    name: `${interaction.client.user.username} | Queue`,
                    iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
                })
                .setDescription(`:arrow_forward: **${queue.current.title}** - ${queue.current.duration}\n\n${queue.tracks.slice((+pageNumber - 1) * 20, +pageNumber * 20).map((song, i) => `[${i + 1 + ((pageNumber-1) * 20)}] **${song.title}** - ${song.duration}`).join('\n')}`)
            .setColor(0xf21f52)
            .setThumbnail(`${interaction.guild.iconURL({ dynamic: true })}`)
            .setFooter({ text: `${queue.tracks.length + 1} Tracks | Queue Time: ${pm(queue.totalTime + queue.current.durationMS, { verbose: true })}` })
            ],
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setEmoji('⏪').setStyle(ButtonStyle.Secondary).setCustomId(`queuePages|${+pageNumber - 1 == 0 ? Math.floor(queue.tracks.length / 20 + 1) : +pageNumber - 1}`),
                new ButtonBuilder().setEmoji('⏩').setStyle(ButtonStyle.Secondary).setCustomId(`queuePages|${+pageNumber + 1 > Math.floor(queue.tracks.length / 20 + 1) ? 1 : +pageNumber + 1}`)
            )]
        });
    }
}