import { Player, GuildQueue, PlayerEvents, Track, PlayerTriggeredReason, onBeforeCreateStream } from 'discord-player';
import consola from 'consola';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from 'discord.js';
import { clearInterval } from 'timers';
//@ts-ignore
import { VoiceConnectionStatus } from '@discordjs/voice';

export const playerEvents = (player: Player) => {
    player.on('debug', (message) => consola.debug('\x1b[33m%s\x1b[90m%s\x1b[0m', '[DPlayer]', message));
    player.events.on('debug', (queue, message) => consola.debug('\x1b[33m%s\x1b[90m%s\x1b[0m', '[PlayerNode]', message));
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
    player.events.on('playerPause', (queue) => {
        let metadata = queue.metadata as any;
        metadata.embed.edit({ embeds: nowPlayingEmbed(queue, queue.currentTrack!), components: nowPlayingComponents(queue) });
    });
    player.events.on('playerResume', (queue) => {
        let metadata = queue.metadata as any;
        metadata.embed.edit({ embeds: nowPlayingEmbed(queue, queue.currentTrack!), components: nowPlayingComponents(queue) });
    });
    player.events.on('disconnect', (queue) => {
        let metadata = queue.metadata as any;
        metadata.channel.send({ content: `No one was  ${queue.channel}` });
    });
    player.events.on('playerError', (queue, error, track) => {
        let metadata = queue.metadata as any;
        let errorChannel = queue.player.client.guilds.cache.get(CiderServers.main)?.channels.cache.get(CiderGuildChannels.botLog) as TextChannel;
        metadata.channel.send({ content: `Error: ${error.message}` });
        errorChannel.send({ content: `Error: ${error.message}\nLast track: ${track.title} by ${track.author} @ ${track.raw.url}` });
    });
    player.events.on('emptyQueue', async (queue) => {
        let metadata = queue.metadata as any;
        let emptyQueueMessage = await metadata.channel.send({
            embeds: [new EmbedBuilder().setColor(0xf21f52).setAuthor({ name: `No more tracks in queue`, iconURL: queue.player.client.user?.displayAvatarURL() })]
        });
        setTimeout(() => {
            emptyQueueMessage.delete().catch((e: Error) => console.log(`Failed to delete emptyQueue message for ${queue.guild}`));
        }, 30000);
    });
    player.events.on('emptyChannel', async (queue) => {
        let metadata = queue.metadata as any;
        let emptyChannelMessage = await metadata.channel.send({ content: `:wave: I'm leaving ${queue.channel} because it has been empty for ${convertMsToMinutes(queue.options.leaveOnEmptyCooldown)}` });
        setTimeout(() => {
            emptyChannelMessage.delete().catch((e: Error) => console.log(`Failed to delete emptyChannel message for ${queue.guild}`));
        }, 30000);
    });

    player.events.on('playerSkip', (queue, track) => {
        let metadata = queue.metadata as any;
        metadata.channel.send({ content: `Skipped **${track.title}**` });
        clearInterval(metadata.interval);
        metadata.embed.delete().catch((e: Error) => console.log(`Failed to delete embed for ${queue.guild} - Skipped`));
    });
    player.events.on('playerFinish', (queue, track) => {
        let metadata = queue.metadata as any;
        clearInterval(metadata.interval);
        metadata.embed.delete().catch((e: Error) => console.log(`Failed to delete embed for ${queue.guild} - Finished`));
    });
    return player;
};
function convertMsToMinutes(ms: number) {
    let minutes = Math.floor(ms / 60000);
    let seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes > 0 ? `${minutes} minutes` : ''} ${minutes > 0 && parseInt(seconds) > 0 ? 'and' : ''} ${parseInt(seconds) > 0 ? `${parseInt(seconds) < 10 ? '0' : ''}${seconds} seconds` : ''}`;
}
export function nowPlayingEmbed(queue: GuildQueue, track: Track) {
    let slidebar = queue.node.createProgressBar();
    return [
        new EmbedBuilder()
            .setTitle(track.title)
            .setURL(track.url)
            .setAuthor({ name: `${queue.player.client.user?.username} | Now Playing`, iconURL: queue.player.client.user?.displayAvatarURL() })
            .setDescription(
                `${track.title} by ${track.author} on ${track.raw.source?.replace(/(^|_)(\w)/g, function ($0, $1, $2) {
                    return ($1 && ' ') + $2.toUpperCase();
                })}. Requested by ${track.requestedBy}\n${
                    queue.node.isPlaying() ? ':arrow_forward:' : ':pause_button:'
                } ${slidebar}\n\nUseful Commands: </play:1087278852813881383> </playnext:1087278852960690217> </lyrics:1087278852813881381> </queue:1087278852960690219> `
            )
            .setColor(0xf21f52)
            .setThumbnail(track.thumbnail)
            .setFooter({ text: queue.tracks.size == 0 ? 'No more tracks in queue' : `Next Track: ${queue.tracks.at(0)?.title}` })
    ];
}
export function nowPlayingComponents(queue: GuildQueue) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setEmoji('🔀')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('shuffle')
                .setDisabled(queue.tracks.size < 2),
            new ButtonBuilder()
                .setEmoji('⏮️')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('previous')
                .setDisabled(queue.history.size < 1),
            new ButtonBuilder()
                .setEmoji(queue.node.isPlaying() ? '⏸️' : '▶️')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(queue.node.isPlaying() ? 'pause' : 'resume'),
            new ButtonBuilder()
                .setEmoji('⏭️')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('skip')
                .setDisabled(queue.tracks.size < 1),
            new ButtonBuilder()
                .setEmoji('🔁')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('loop')
                .setDisabled(queue.tracks.size < 1)
        )
    ];
}
