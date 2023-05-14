import { AutocompleteInteraction, ChatInputCommandInteraction, Guild, GuildMember, GuildVoiceChannelResolvable, SlashCommandBuilder } from 'discord.js';
import { OnBeforeCreateStreamHandler, QueryType, SearchResult, Track, onBeforeCreateStream } from 'discord-player';
import consola from 'consola';
import { searchMusics } from 'node-youtube-music';
import { stream } from 'play-dl';
import { getInfo, search } from '../../integrations/musickitAPI.js';

type SongType = { type: string, attributes: { artistName: string; name: string; url: string; }; }
export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song!')
        .addStringOption((option) => option.setName('query').setDescription('The song to play!').setAutocomplete(true).setRequired(true)),
    category: 'Music',
    async autocomplete(interaction: AutocompleteInteraction) {
        let query = interaction.options.getFocused();
        if (!query) return interaction.respond([]);
        const results = await search(interaction.client.amAPIToken, query, 'us', 10);
        results.forEach((t: SongType ) => {
            if (t.type === 'songs') t.type = 'Song';
            else if (t.type === 'albums') t.type = 'Album';
            else if (t.type === 'playlists') t.type = 'Playlist';
            if(!t.attributes.artistName) t.attributes.artistName = '';
            t.attributes.name = `${t.type}: ${t.attributes.artistName != '' ? t.attributes.artistName + ' - ' : ''}${t.attributes.name}`.slice(0, 100);
        });
        return interaction.respond(
            results.map((t: SongType) => ({
                name: t.attributes.name,
                value: t.attributes.url.length > 100 ? (t.attributes.name + ' by ' + t.attributes.artistName).slice(0, 100) : t.attributes.url
            }))
        );
    },
    async execute(interaction: ChatInputCommandInteraction) {
        let player = interaction.client.player;
        if (!(interaction.member as GuildMember).voice.channelId) return await interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
        if ((interaction.guild as Guild).members.me!.voice.channelId && (interaction.member as GuildMember).voice.channelId !== (interaction.guild as Guild).members.me!.voice.channelId)
            return await interaction.reply({ content: 'You are not in my voice channel!', ephemeral: true });
        let query = interaction.options.get('query')?.value as string;
        if (query.startsWith('http') && query.includes('youtube.com') && query.includes('watch?v=') && query.includes('&list')) query = `https://youtube.com/playlist?list=${query.split('list=')[1]}`;
        else if(query.startsWith('http') && query.includes('soundcloud.com')) query = query.split('?')[0];
        await interaction.reply({ content: `Searching for \`${query}\`` });
        try {
            let searchResult = await player.search(query, { requestedBy: interaction.user });
            let queue = player.nodes.get(interaction.guildId!);
            if (!queue) queue = createQueue(interaction);
            if (!queue.connection) await queue.connect((interaction.member as GuildMember).voice.channel as GuildVoiceChannelResolvable);
            queue.addTrack(searchResult.hasPlaylist() ? (searchResult.playlist?.tracks as Track[]) : searchResult.tracks[0]);
            if (!queue.isPlaying()) await queue.node.play();
            if (searchResult.hasPlaylist()) {
                interaction.editReply({ content: `Added **${(searchResult as SearchResult).playlist!.title}** with \`${searchResult.tracks.length}\` tracks to the queue` });
            } else {
                interaction.editReply({ content: `Added **${searchResult.tracks[0].author} - ${searchResult.tracks[0].title}** to the queue` });
            }
        } catch (error) {
            consola.error(error);
            interaction.editReply({ content: `❌ | Cannot find \`${query}\`` });
        }
    }
};

export function createQueue(interaction: ChatInputCommandInteraction) {
    let player = interaction.client.player;
    return player.nodes.create(interaction.guild!, {
        metadata: {
            channel: interaction.channel,
            client: interaction.guild!.members.me,
            requestedBy: interaction.user
        },
        selfDeaf: true,
        volume: 80,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 300000,
        async onBeforeCreateStream(track, source) {
            if (source === 'appleMusicSong') {
                if(track.duration == "0:00") track.duration = msToTime((await getInfo(interaction.client.amAPIToken, track.url)).attributes.durationInMillis); 
                const results = await searchMusics(`${track.title} by ${track.author}`);
                let filteredResults = results.filter((r) => r.title === track.title);
                if (filteredResults.length === 0) filteredResults = results.filter((r) => r.title?.includes(track.title))
                track.raw.url = `https://youtube.com/watch?v=${filteredResults[0].youtubeId}`;
                consola.success(`Playing ${track.title} by ${track.author} @ ${track.raw.url}`);
                return (await stream(track.raw.url, { discordPlayerCompatibility: true })).stream;
            }
            return null;
        }
    });
}
function msToTime(ms: number) {
    let secs = Math.floor(ms / 1000);
    ms %= 1000;
    let mins = Math.floor(secs / 60);
    secs %= 60;
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
}