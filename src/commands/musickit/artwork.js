import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getArtwork } from '../../integrations/musickitAPI.js';
import 'dotenv/config';

export const command = {
    data: new SlashCommandBuilder()
        .setName("artwork")
        .setDescription("gives you artwork from apple music, provided the query")
        .addStringOption(o => o.setName("query").setRequired(false).setDescription("The song/artist to get the artwork of (works with apple music links and normal queries only)").setRequired(true)),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        let amAPIToken = client.amAPIToken;
        let query = interaction.options.getString('query');
        if(query && !query.startsWith('https://')) {
            query = `https://api.music.apple.com/v1/catalog/us/search/${query.replace(' ', '+')}`;
        }
        await interaction.reply({ content: 'Getting artwork from Apple Music' });
        let res = await getArtwork(amAPIToken, query);
        await interaction.editReply(res);
        
        

    }
}