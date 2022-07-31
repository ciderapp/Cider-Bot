import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getLyrics } from '../../integrations/geniusLyrics.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName("lyrics")
        .setDescription("Get the lyrics of a song current playing or queried!")
        .addStringOption(o => o.setName("query").setRequired(false).setDescription("The song to get the lyrics of")),
    category: 'Music',
    execute: async (interaction) => {
        if(interaction.guildId == process.env.guildId && interaction.channelId != "843954941827481670") return await interaction.reply({ content: "You must be in <#843954941827481670> to use this command!", ephemeral: true })
        let { client } = await import('../../index.js');
        let query = interaction.options.getString('query');
        await interaction.reply({ content: 'Getting lyrics...'});
        if(!query) {
            const musicordPlayer = client.musicordPlayer;
            const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
            if (!queueInfo.songs[0]) return await interaction.editReply('There is no song playing!');
            let fullTitle = queueInfo.songs[0].title.toLowerCase().search(/-|by|"/g) >= 0 ? queueInfo.songs[0].title : `${queueInfo.songs[0].channel.title.split('-')[0].trim()} ${queueInfo.songs[0].title}`;
            fullTitle = fullTitle.replace(/(M\/V)|[^a-z| ]|(audio)|(Official Video)/gi, '');
            consola.info("Getting lyrics for " + fullTitle);
            let lyrics = await getLyrics(fullTitle);
            consola.info(typeof lyrics)
            if(lyrics == null) {
                return await interaction.editReply({ content:`No lyrics found for \`${queueInfo.songs[0].title}\`` });
            }
            else{
                consola.success("Lyrics found!", lyrics);
                await interaction.editReply({ content:"", embeds: [lyrics] });
            }
            // await interaction.deferReply();
            
        }
        else {
            await interaction.editReply({ content:"", embeds: [await getLyrics(query)] });
        }
        
        
    }
}