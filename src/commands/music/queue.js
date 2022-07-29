import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
import { default as pm } from 'pretty-ms';
export const command = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Shows the current queue"),
    category: 'Music',
    execute: async (interaction) => {
        let components = [];
        let { client } = await import('../../index.js');
        const musicordPlayer = client.musicordPlayer;
        const queue = musicordPlayer.getQueue(interaction.guild);
        if (!queue.isPlaying) return await interaction.reply({ content: 'There is no song playing currently!', ephemeral: true });
        const member = interaction.guild.members.cache.get(interaction.member.user.id);
        let songlist = queue.getSongs();
        let totalTime = 0;
        songlist.forEach(track => {
            totalTime += track.msDuration;
        });
        let queueEmbed = new EmbedBuilder()
            .setTitle(`Song Queue for ${interaction.guild.name} ${songlist.length > 20 ? `(1/${Math.floor(songlist.length / 20) + 1})` : ''}`)
            .setAuthor({
                name: `${interaction.client.user.username} | Queue`,
                iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
            })
            .setDescription(`${songlist.slice(0, 20).map((song, i) => `${i == 0 ? ':arrow_forward: ' : `[${i}] `} **${song.title}** - ${song.duration} ${i == 0 ? '\n' : ''}`).join('\n')}`)
            .setColor(0xf21f52)
            .setThumbnail(`${interaction.guild.iconURL({ dynamic: true })}`)
            .setFooter({ text: `${songlist.length} Tracks | Queue Time: ${pm(totalTime, { verbose: true })}` },);

        if (songlist.length > 20) {
            components = [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setEmoji('⏪').setStyle(ButtonStyle.Secondary).setCustomId(`queuePages|${Math.floor(songlist.length / 20 + 1)}`),
                new ButtonBuilder().setEmoji('⏩').setStyle(ButtonStyle.Secondary).setCustomId(`queuePages|2`)
            )]
        }
        await interaction.reply({ embeds: [queueEmbed], components });
    }
};
