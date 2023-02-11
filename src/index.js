import { Client, GatewayIntentBits, Partials, Collection, ActivityType, EmbedBuilder, resolveColor, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { firebase } from "./integrations/firebase.js";
import { getAPIToken } from "./integrations/musickitAPI.js";
import consola from 'consola';


import { readdirSync } from 'fs';

import 'dotenv/config';
import { Player } from 'discord-player';
import { startServer } from "./server/express.js";
import { getLyrics } from "./integrations/geniusLyrics.js";
import { getServiceStatus } from "./integrations/serviceStatus.js";

// Configure Client Intents for Public bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        // GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction
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
}
// // Import Autoreply files
// const replyFiles = readdirSync('./src/replies').filter(file => file.endsWith('.json'));
// for (const file of replyFiles) {
//     let { default: reply } = await import(`./replies/${file}`, { assert: { type: 'json' } });
//     client.replies.push(reply);
//     consola.info("\x1b[32m%s\x1b[0m", "Registered Reply:", reply.name);
// }

async function syncUsers(guild) {
    if (guild != null) {
        await firebase.setActiveUsers(guild.roles.cache.get("932784788115427348").members.size)
        await firebase.setTotalUsers(guild.roles.cache.get("932816700305469510").members.size)
        client.activeUsers = await firebase.getActiveUsers();
        client.totalUsers = await firebase.getTotalUsers();
        client.user.setActivity(`${client.activeUsers} / ${Intl.NumberFormat('en', { notation: 'compact' }).format(client.totalUsers)} Active Cider Users`, { type: ActivityType.Watching });
        consola.info(`Total Users: ${client.totalUsers} | Active Users: ${client.activeUsers}`)
    }
}
async function syncAppleApiStatus(guild) {
    if (process.env.NODE_ENV != "production") return;
    let channel = guild.channels.cache.get(process.env.APPLE_STATUS_CHANNEL);
    let services = await getServiceStatus();
    if (services.length === 0) return
    let embeds = [];
    let statusEmoji = "";

    for (let service of services) {
        if (service.event.eventStatus === "resolved") statusEmoji = "🟢";
        else if (service.event.eventStatus === "ongoing") statusEmoji = "🟠";
        else if (service.event.eventStatus === "scheduled") statusEmoji = "🟡";
        else statusEmoji = "🔴";
        let embed = new EmbedBuilder()
            .setAuthor({ name: service.serviceName, url: service.redirectUrl, iconURL: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png" })
            .setDescription(`${statusEmoji} ${service.event.statusType} - ${service.event.usersAffected}\n\n${service.event.message}`)
            .setFields([{ name: "Status", value: `${service.event.eventStatus}`, inline: true }, { name: "Message ID", value: service.event.messageId, inline: true }, { name: "Affected Service", value: service.event.affectedServices || service.serviceName, inline: true }])
            .setTimestamp();
        if (service.event.epochStartDate) embed.addFields({ name: "Start Date", value: `<t:${service.event.epochStartDate / 1000}:R>`, inline: true });
        if (service.event.epochEndDate) embed.addFields({ name: "End Date", value: `<t:${service.event.epochEndDate / 1000}:R>`, inline: true });
        if (service.event.eventStatus === "resolved") embed.setColor([0, 255, 0]);
        else if (service.event.eventStatus === "ongoing") embed.setColor([255, 180, 0]);
        embeds.push(embed);
    }
    channel.send({ embeds })
}

/***  CLIENT EVENTS ***/

client.on('ready', async () => {
    const Guilds = client.guilds.cache.map(guild => guild.name);
    let guild = client.guilds.cache.get(process.env.guildId);

    consola.success(`Logged in as ${client.user.tag} at ${Date()}`);
    await syncUsers(guild); 
    await syncAppleApiStatus(guild);
    startServer();
    setInterval(() => { syncUsers(guild); }, 1800000);
    setInterval(() => { syncAppleApiStatus(guild); }, 300000);
    guild.channels.cache.get(process.env.errorChannel).send({ embeds: [{ color: 0x00ff00, title: `Bot Initialized <t:${Math.trunc(Date.now() / 1000)}:R>`, description: `Commands: ${client.commands.size}\nServers: ${client.guilds.cache.size}\n\n **Server List**\n${Guilds.join('\n')}` }] });
});

client.on('presenceUpdate', async (oldMember, newMember) => { client.events.find(event => event.name === "presenceUpdate").execute(oldMember, newMember) });

// client.on('messageCreate', async (message) => {
//     // consola.info(client.replies);
//     client.events.find(event => event.name === "messageCreate").execute(message, client.replies)
// });

client.on('messageReactionAdd', async (reaction, user) => { client.events.find(event => event.name === "messageReactionAdd").execute(reaction, user) });

client.on('interactionCreate', async interaction => {
    // if (!interaction.isChatInputCommand()) return;
    if (interaction.isStringSelectMenu()) {
        if (!client.interactions.get(interaction.customId)) return;
        try {
            await client.interactions.get(interaction.customId).execute(interaction);
        } catch (error) {
            consola.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
            await interaction.member.guild.channels.cache.get(process.env.errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
        }
    } else if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {

            firebase.commandCounter(interaction.commandName)
            await command.execute(interaction);
        } catch (error) {
            consola.error(error);
            await interaction.reply({ title: "Error", content: 'There was an error while executing this command!', ephemeral: true });
            let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
            await interaction.member.guild.channels.cache.get(process.env.errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
        }
    } else if (interaction.isButton()) {
        try {
            if (interaction.customId.split('|')[1] != null) {
                await client.interactions.get(interaction.customId.split('|')[0]).execute(interaction);
            } else {
                const command = client.commands.get(interaction.customId);
                firebase.commandCounter(interaction.commandName)
                await command.execute(interaction);
            }
        } catch (error) {
            consola.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
            await interaction.member.guild.channels.cache.get(process.env.errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
        }

    }
});
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
