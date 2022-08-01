import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
import { default as pm } from 'pretty-ms';
import 'dotenv/config';

export const command = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Shows the current queue"),
    category: 'Music',
    execute: async (interaction) => {
        let components = [];
        let { client } = await import('../../index.js');
        const player = client.player;
        const queue = player.getQueue(interaction.guild);
        if (!queue) return await interaction.reply({ content: 'There is no song playing currently!', ephemeral: true });
        if (interaction.guildId == process.env.guildId && interaction.channelId != "843954941827481670") return await interaction.reply({ content: "This command can only be used in the <#843954941827481670> channel!", ephemeral: true });
        let queueEmbed = new EmbedBuilder()
            .setTitle(`Song Queue for ${interaction.guild.name} ${queue.tracks.length > 20 ? `(1/${Math.floor(queue.tracks.length / 20) + 1})` : ''}`)
            .setAuthor({
                name: `${interaction.client.user.username} | Queue`,
                iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
            })
            .setDescription(`:arrow_forward: **${queue.current.title}** - ${queue.current.duration}\n\n${queue.tracks.slice(0, 20).map((song, i) => `[${i + 1}] **${song.title}** - ${song.duration}`).join('\n')}`)
            .setColor(0xf21f52)
            .setThumbnail(`${interaction.guild.iconURL({ dynamic: true })}`)
            .setFooter({ text: `${queue.tracks.length + 1} Tracks | Queue Time: ${pm(queue.totalTime + queue.current.durationMS, { verbose: true })}` });

        if (queue.tracks.length > 20) {
            components = [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setEmoji('⏪').setStyle(ButtonStyle.Secondary).setCustomId(`queuePages|${Math.floor(queue.tracks.length / 20 + 1)}`),
                new ButtonBuilder().setEmoji('⏩').setStyle(ButtonStyle.Secondary).setCustomId(`queuePages|2`)
            )]
        }
        await interaction.reply({ embeds: [queueEmbed], components });
    }
}