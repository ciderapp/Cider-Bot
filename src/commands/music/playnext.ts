import { AutocompleteInteraction, ChatInputCommandInteraction, Guild, GuildMember, GuildVoiceChannelResolvable, SlashCommandBuilder } from 'discord.js';
import { QueryType, SearchResult, Track } from 'discord-player';
import consola from 'consola';
import { createQueue } from './play.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName('playnext')
        .setDescription('Play a song at the top of the queue!')
        .addStringOption((option) => option.setName('query').setDescription('The song to play!').setAutocomplete(true).setRequired(true)),
    category: 'Music',
    async autocomplete(interaction: AutocompleteInteraction) {
        let query = interaction.options.getFocused();
        const results = await interaction.client.player.search(query!, {
            searchEngine: QueryType.APPLE_MUSIC_SEARCH,
            requestedBy: interaction.user
        });
        consola.info(results)
        return interaction.respond(
            results.tracks.slice(0, 10).map((t) => ({
                name: (t.author + ' - ' + t.title).length > 100 ? (t.author + ' - ' + t.title).slice(0, 97) + '...' : t.author + ' - ' + t.title,
                value: t.url.length > 100 ? (t.title + ' by ' + t.author).slice(0, 100) : t.url
            }))
        );
    },
    async execute(interaction: ChatInputCommandInteraction) {
        let player = interaction.client.player;
        consola.info(interaction.user);
        if (!(interaction.member as GuildMember).voice.channelId) return await interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
        if ((interaction.guild as Guild).members.me!.voice.channelId && (interaction.member as GuildMember).voice.channelId !== (interaction.guild as Guild).members.me!.voice.channelId)
            return await interaction.reply({ content: 'You are not in my voice channel!', ephemeral: true });
        let query = interaction.options.get('query')?.value as string;
        if (query.startsWith('http') && query.includes('youtube.com') && query.includes('watch?v=') && query.includes('&list')) query = `https://youtube.com/playlist?list=${query.split('list=')[1]}`;
        else if(query.startsWith('http') && query.includes('soundcloud.com')) query = query.split('?')[0];
        await interaction.reply({ content: `Searching for \`${query}\`` });
        try {
            let result = await player.search(query, { requestedBy: interaction.user.id });
            consola.info('TRACK:');
            console.log(result.tracks[0])
            let queue = player.nodes.get(interaction.guildId as string);
            if (!queue) {
                queue = createQueue(interaction);
                if (!queue.connection) await queue.connect((interaction.member as GuildMember).voice.channel as GuildVoiceChannelResolvable);
                queue.addTrack(result.hasPlaylist() ? (result.playlist?.tracks as Track[]) : result.tracks[0]);
                if (!queue.isPlaying()) await queue.node.play();
                if (result.hasPlaylist()) {
                    return interaction.editReply({ content: `Added **${(result as SearchResult).playlist!.title}** with \`${result.tracks.length}\` tracks to the queue` });
                } else {
                    return interaction.editReply({ content: `Added **${result.tracks[0].author} - ${result.tracks[0].title}** to the queue` });
                }
            }
            
            queue.insertTrack(result.tracks[0], 0);
            if (result.tracks[0].raw.source === 'youtube' && result.tracks[0].author.endsWith(' - Topic')) result.tracks[0].author = result.tracks[0].author.replace(' - Topic', '');
            interaction.editReply({ content: `Added **${result.tracks[0].author} - ${result.tracks[0].title}** to the queue` });
        } catch (error) {
            consola.error(error);
            interaction.editReply({ content: `❌ | Cannot find \`${query}\`` });
        }
    }
};
