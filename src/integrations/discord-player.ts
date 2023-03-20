import { Player, GuildQueue, PlayerEvents, Track, PlayerTriggeredReason } from 'discord-player';
import consola from 'consola'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} from 'discord.js';
import { clearInterval } from 'timers';
//@ts-ignore
import { VoiceConnectionStatus } from '@discordjs/voice';

export const playerEvents = ((player: Player) => {
    player.events.on('debug', (queue, message) => consola.debug(message));
    player.events.on('error', (queue, error) => consola.error(error));
    player.events.on('playerStart', async (queue, track) => {
        let metadata = queue.metadata as any;
        let embed = await metadata.channel.send({ embeds: nowPlayingEmbed(queue, track), components: nowPlayingComponents(queue) });
        let interval = setInterval(() => {
            metadata.embed.edit({ embeds: nowPlayingEmbed(queue, track), components: nowPlayingComponents(queue) });
        }, 5000);
        metadata.interval = interval;
        metadata.embed = embed;
    });
    player.events.on('playerSkip', (queue, track) => {
        let metadata = queue.metadata as any;
        metadata.channel.send({content: `Skipped **${track.title}**`});
        clearInterval(metadata.interval)
        metadata.embed.delete();
    });
    player.events.on('playerFinish', (queue, track) => {
        let metadata = queue.metadata as any;
        clearInterval(metadata.interval)
        metadata.embed.delete();
    });
    return player;
    
})

export function nowPlayingEmbed(queue: GuildQueue, track: Track) {
    let slidebar = queue.node.createProgressBar();
    return [new EmbedBuilder()
        .setTitle(track.title)
        .setURL(track.url)
        .setAuthor({ name: `${queue.player.client.user?.username} | Now Playing`, iconURL: queue.player.client.user?.displayAvatarURL()})
        .setDescription(`${track.title} by ${track.author} on ${track.raw.source?.replace(/(^|_)(\w)/g, function ($0, $1, $2) { return ($1 && ' ') + $2.toUpperCase() })}. Requested by ${track.requestedBy}\n${queue.node.isPlaying() ? ':arrow_forward:' : ':pause_button:'} ${slidebar}\n\nUseful Commands: </play:1087278852813881383> </playnext:1087278852960690217> </lyrics:1087278852813881381> </queue:1087278852960690219> `)
        .setColor(0xf21f52)
        .setThumbnail(track.thumbnail)
        .setFooter({ text: queue.tracks.size == 0 ? 'No more tracks in queue' : `Next Track: ${queue.tracks.at(0)?.title}` })
    ]
}
export function nowPlayingComponents(queue: GuildQueue) {
    return [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setEmoji('🔀').setStyle(ButtonStyle.Secondary).setCustomId('shuffle').setDisabled(queue.tracks.size < 2),
        new ButtonBuilder().setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setCustomId('previous').setDisabled(queue.history.size < 1),
        new ButtonBuilder().setEmoji(queue.node.isPlaying() ? '⏸️' : '▶️').setStyle(ButtonStyle.Secondary).setCustomId(queue.node.isPlaying() ? 'pause' : 'resume'),
        new ButtonBuilder().setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setCustomId('skip').setDisabled(queue.tracks.size < 1),
        new ButtonBuilder().setEmoji('🔁').setStyle(ButtonStyle.Secondary).setCustomId('loop').setDisabled(queue.tracks.size < 1))
    ]
}