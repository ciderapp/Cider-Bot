import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getLyrics } from '../../integrations/geniusLyrics.js';
import 'dotenv/config';

export const command = {
    data: new SlashCommandBuilder()
        .setName("lyrics")
        .setDescription("Get the lyrics of a song current playing or queried!")
        .addStringOption(o => o.setName("query").setRequired(false).setDescription("The song to get the lyrics of")),
    category: 'Music',
    execute: async (interaction) => {
        if (interaction.guildId == process.env.guildId && !interaction.channelId == "843954941827481670") return await interaction.reply({ content: "This command can only be used in the <#843954941827481670> channel!", ephemeral: true });
        let { client } = await import('../../index.js');
        let query = interaction.options.getString('query');
        await interaction.reply({ content: 'Getting lyrics...' });
        if (!query) {
            const player = client.player;
            const queue = player.getQueue(interaction.guild);
            if (!queue) return await interaction.reply({ content: 'There is no song playing currently, use query your lyrics or play a song!', ephemeral: true });
            let fullTitle = queue.current.title.toLowerCase().search(/-|by|"|:/g) >= 0 ? queue.current.title : `${queue.current.author.split('-')[0].trim()} ${queue.current.title}`;
            fullTitle = (fullTitle.replace(/(M\/V)|[^a-z| ]|(audio)|(Official Video)|(Official Audio)|(MV)|(Music Video)|(Official)|(Lyric)|(Video)/gi, '')).trim();
            await interaction.editReply({ content: `Getting lyrics for \`${fullTitle}\`` });
            let lyrics = await getLyrics(fullTitle);
            if (lyrics == null) {
                return await interaction.editReply({ content: `No lyrics found for \`${queue.current.title}\`` });
            }
            else {
                await interaction.editReply({ content: "", embeds: [lyrics] });
            }
        } else {
            await interaction.editReply({ content: `Getting lyrics for \`${query}\`` });
            let lyrics = await getLyrics(query);
            if (lyrics == null) {
                return await interaction.editReply({ content: `No lyrics found for \`${query}\`` });
            }
            else {
                await interaction.editReply({ content: "", embeds: [lyrics] });
            }

        }


    }
}