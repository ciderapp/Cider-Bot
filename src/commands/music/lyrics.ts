import { ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, Guild, GuildMember, SlashCommandBuilder } from 'discord.js';
import { nowPlayingComponents, nowPlayingEmbed } from '../../integrations/discord-player.js';
import { lyricsExtractor } from '@discord-player/extractor';
import { GuildQueue, Track } from 'discord-player';
import consola from 'consola';
export const command = {
    data: new SlashCommandBuilder()
        .setName("lyrics")
        .setDescription("get the lyrics of the current song!/ get the lyrics of a song!")
        .addStringOption(option => option.setName("song").setDescription("the song you want to get the lyrics of!").setRequired(false)),
    category: 'Music',
    async execute(interaction: ChatInputCommandInteraction) {
        const lyricsFinder = lyricsExtractor(/* 'optional genius API key' */);
        let query = interaction.options.getString("song");
        let queue = interaction.client.player.nodes.get(interaction.guildId as string) as GuildQueue;
        if (!queue && !query) return await interaction.reply({ content: "There is no music playing and no song was specified!", ephemeral: true });
        if (!query) query = `${(queue.currentTrack?.raw.source == "youtube" && !queue.currentTrack?.author.endsWith(' - Topic')) ? '' : queue.currentTrack?.author.replace(' - Topic', '')} ${queue.currentTrack?.title}`
        await interaction.reply({ content: `Searching for \`${query}\``})
        const lyrics = await lyricsFinder.search(query as string).catch((err) => consola.error(err));
        if (!lyrics) return interaction.followUp({ content: 'No lyrics found', ephemeral: true });
        const trimmedLyrics = lyrics.lyrics.substring(0, 1997);
        const embed = new EmbedBuilder()
            .setTitle(lyrics.title)
            .setURL(lyrics.url)
            .setThumbnail(lyrics.thumbnail)
            .setAuthor({
                name: lyrics.artist.name,
                iconURL: lyrics.artist.image,
                url: lyrics.artist.url
            })
            .setDescription(trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics)
            .setColor('Yellow');

        return interaction.editReply({ content:"", embeds: [embed] });
    }
}