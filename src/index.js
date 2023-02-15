import { Client, GatewayIntentBits, Partials, Collection, ActivityType, EmbedBuilder, resolveColor, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import { getAPIToken } from "./integrations/musickitAPI.js";
import consola from 'consola';
import { readdirSync } from 'fs';
import 'dotenv/config';
import { Player } from 'discord-player';
import { getLyrics } from "./integrations/geniusLyrics.js";


// Configure Client Intents for Public bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        // GatewayIntentBits.GuildMessages,
        // GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
    ],
    partials: [
        // Partials.Channel,
        // Partials.User,
        // Partials.GuildMember,
        // Partials.Reaction
    ]
});
client.player = new Player(client, { ytdlOptions: { quality: 'highestaudio' } });
client.amAPIToken = await getAPIToken();
client.commands = new Collection();
client.interactions = new Collection();
client.events = [];
client.totalUsers = 0;
client.activeUsers = 0;
export { client };

// add Debug Console
const consolaDebug = consola.create({ level: 5 })

// Import Command Files
const commandFolders = readdirSync('./src/commands/');
for (const folder of commandFolders) {
    const commandFiles = readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const { command } = await import(`./commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
        consola.info("\x1b[32m%s\x1b[0m", "Registered Command:", command.data.name, command?.category);
    }
}
// Import Interaction files
const interactionFiles = readdirSync('./src/interactions').filter(file => file.endsWith('.js'));
for (const file of interactionFiles) {
    const { interaction } = await import(`./interactions/${file}`);
    client.interactions.set(interaction.data.name, interaction);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Interaction:", interaction.data.name);
}
// Import Event files
const eventFiles = readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    let { event } = await import(`./events/${file}`);
    client.events.push(event);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Event:", event.name);
    if(event?.devOnly && process.env.NODE_ENV !== 'development') continue;
    if (event?.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.TOKEN);

let npInterval, npEmbed;
client.player.on('trackStart', async (queue, track) => {
    consola.info("Track:", track)
    consola.info("Queue:", queue);
    // consola.info("Player Info", queue.player.voiceUtils);
    // consola.info("Voice Connection", queue.player.voiceUtils.getConnection('585180490202349578').audioResource);
    // consola.info("Audio Resource", queue.player.voiceUtils.getConnection('585180490202349578').audioResource);
    // consola.info("Audio Player", queue.player.voiceUtils.getConnection('585180490202349578').audioPlayer);
    // consola.info("Channel", queue.player.voiceUtils.getConnection('585180490202349578').channel);
    let slidebar = queue.createProgressBar();
    npEmbed = await queue.metadata.channel.send({
        embeds: [new EmbedBuilder()
            .setTitle(`${track.title}`)
            .setAuthor({
                name: `${client.user.username} | Now Playing`,
                iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
            })
            .setDescription(`${track.description + "\n" || ""}${queue.connection.paused ? ':pause_button:' : ':arrow_forward:'} ${slidebar}`)
            .setColor(0xf21f52)
            .setThumbnail(`${track.thumbnail}`)
            .setURL(`${Number.isInteger(track.views) ? track.url : track.views}`)
            .setFooter({ text: queue.tracks[0] != null ? `Next Track: ${queue.tracks[0].title}` : 'No more tracks in queue' })
        ],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setEmoji('🔀').setStyle(ButtonStyle.Secondary).setCustomId('shuffle').setDisabled(queue.tracks.length < 2),
            new ButtonBuilder().setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setCustomId('previous').setDisabled(queue.previousTracks.length < 1),
            new ButtonBuilder().setEmoji(queue.connection.paused ? '▶️' : '⏸️').setStyle(ButtonStyle.Secondary).setCustomId(queue.connection.paused ? 'resume' : 'pause'),
            new ButtonBuilder().setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setCustomId('skip').setDisabled(queue.tracks.length < 1),
            new ButtonBuilder().setEmoji('🔁').setStyle(ButtonStyle.Secondary).setCustomId('loop').setDisabled(queue.tracks.length < 1))
        ]
    });

    npInterval = setInterval(async () => {
        slidebar = queue.createProgressBar();
        await npEmbed.edit({
            embeds: [new EmbedBuilder()
                .setTitle(`${queue.current.title}`)
                .setAuthor({
                    name: `${client.user.username} | Now Playing`,
                    iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
                })
                .setDescription(`${track.description + "\n" || ""}${queue.connection.paused ? ':pause_button:' : ':arrow_forward:'} ${slidebar}`)
                .setColor(0xf21f52)
                .setThumbnail(`${track.thumbnail}`)
                .setURL(`${Number.isInteger(track.views) ? track.url : track.views}`)
                .setFooter({ text: queue.tracks[0] != null ? `Next Track: ${queue.tracks[0].title}` : 'No more tracks in queue' })
            ],
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setEmoji('🔀').setStyle(ButtonStyle.Secondary).setCustomId('shuffle').setDisabled(queue.tracks.length < 2),
                new ButtonBuilder().setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setCustomId('previous').setDisabled(queue.previousTracks.length < 1),
                new ButtonBuilder().setEmoji(queue.connection.paused ? '▶️' : '⏸️').setStyle(ButtonStyle.Secondary).setCustomId(queue.connection.paused ? 'resume' : 'pause'),
                new ButtonBuilder().setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setCustomId('skip').setDisabled(queue.tracks.length < 1),
                new ButtonBuilder().setEmoji('🔁').setStyle(ButtonStyle.Secondary).setCustomId('loop').setDisabled(queue.tracks.length < 1))
            ]
        })
    }, 5000);
})

client.player.on('trackEnd', async (queue, track) => {
    clearInterval(npInterval);
    await npEmbed.delete();
})

client.player.on('connectionError', async (queue, error) => {
    queue.destroy();
    if (npInterval) clearInterval(npInterval);
    consola.error(error)
    await queue.metadata.channel.send({ content: `There was an error playing the track!`, embeds: [{ color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }] })
})
client.player.on('debug', async (queue, message) => {
    consolaDebug.debug(message)
})
client.player.on('botDisconnect', async (queue) => {
    queue.stop();
    queue.destroy();
    if (npInterval) clearInterval(npInterval);
})
client.player.on('error', async (queue, error) => {
    queue.stop();
    queue.destroy();
    if (npInterval) clearInterval(npInterval);
    consola.error(error)
    // await client.channels.cache.get(process.env.errorChannel).send({ content: `There was an error playing the track!`, embeds: [{ color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }] })
})

/*** ERROR HANDLING ***/
process.on('unhandledRejection', error => {
    consola.error(error);
    consola.error(error.stack);
    let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
    client.channels.cache.get(process.env.errorChannel).send({ content: `Unhandled Rejection`, embeds: [errorEmbed] })
})
process.on('uncaughtException', error => {
    consola.error(error);
    consola.error(error.stack);
    let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
    client.channels.cache.get(process.env.errorChannel).send({ content: `Uncaught Exception`, embeds: [errorEmbed] })
})
