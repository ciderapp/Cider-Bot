import { AutocompleteInteraction, ChatInputCommandInteraction, Guild, GuildMember, GuildVoiceChannelResolvable, SlashCommandBuilder } from 'discord.js';
import { QueryType } from 'discord-player';
import { searchMusics } from 'node-youtube-music'
import consola from 'consola';
export const command = {
    data: new SlashCommandBuilder()
        .setName("playnext")
        .setDescription("Play a song at the top of the queue!")
        .addStringOption(option => option.setName("query")
            .setDescription("The song to play!")
            .setAutocomplete(true)
            .setRequired(true)
        ),
    category: 'Music',
    async autocomplete(interaction: AutocompleteInteraction) {
        let query = interaction.options.getFocused();
        const results = await interaction.client.player.search(query!, {
            searchEngine: QueryType.APPLE_MUSIC_SEARCH
        });
        return interaction.respond(
            results.tracks.slice(0, 10).map((t) => ({
                name: (t.author+ " - " + t.title).length > 100 ? (t.author+ " - " + t.title).slice(0, 100) + "..." : t.author+ " - " + t.title,
                value: t.url.length > 100 ? (t.title + ' by ' + t.author) : t.url
            }))
        );
    },
    async execute(interaction: ChatInputCommandInteraction) {
        let player = interaction.client.player;
        consola.info(interaction.user)
        if (!(interaction.member as GuildMember).voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if ((interaction.guild as Guild).members.me!.voice.channelId && (interaction.member as GuildMember).voice.channelId !== (interaction.guild as Guild).members.me!.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        let query = interaction.options.get('query')?.value as string;
        await interaction.reply({ content: `Searching for \`${query}\``})
        try {
            let result = await player.search(query, { requestedBy: interaction.user.id });
            consola.info("TRACK:", result.tracks[0])
            player.nodes.get(interaction.guildId as string)?.insertTrack(result.tracks[0], 0);
            if(result.tracks[0].raw.source === 'youtube' && result.tracks[0].author.endsWith(' - Topic')) result.tracks[0].author = result.tracks[0].author.replace(' - Topic', '')
            interaction.editReply({ content: `Added **${result.tracks[0].author} - ${result.tracks[0].title}** to the queue`})
        } catch (error) {
            consola.error(error)
            interaction.editReply({ content: `❌ | Cannot find \`${query}\`` })
        }
    }
}