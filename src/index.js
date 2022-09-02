import { Client, GatewayIntentBits, Partials, Collection, ActivityType, EmbedBuilder, resolveColor } from "discord.js"; // Define Client, Intents, and Collection
import consola from 'consola';
import { mongo } from './integrations/mongo.js';
import { readdirSync } from 'fs';
import { getAPIToken } from "./integrations/musickitAPI.js";
import 'dotenv/config';
import { Player } from 'discord-player';
import { startServer } from "./server/express.js";
import { getLyrics } from "./integrations/geniusLyrics.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
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
client.replies = [];
client.events = [];
client.totalUsers = 0;
client.activeUsers = 0;
client.canPingKeefe = true;
client.canLeak = true;


export { client };

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
// Import Autoreply files
const replyFiles = readdirSync('./src/replies').filter(file => file.endsWith('.json'));
for (const file of replyFiles) {
    let { default: reply } = await import(`./replies/${file}`, { assert: { type: 'json' } });
    client.replies.push(reply);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Reply:", reply.name);
}

async function syncUsers(guild) {
    if (guild != null) {
        mongo.setActiveUsers(guild.roles.cache.get("932784788115427348").members.size)
        mongo.setTotalUsers(guild.roles.cache.get("932816700305469510").members.size)
        mongo.getActiveUsers().then(users => {
            client.activeUsers = users;
            mongo.getTotalUsers().then(users => {
                client.totalUsers = users;
                client.user.setActivity(`${client.activeUsers} / ${client.totalUsers} Active Cider Users`, { type: ActivityType.Watching });
                consola.info(`Total Users: ${client.totalUsers} | Active Users: ${client.activeUsers}`)
            })
        })
    }
}

/***  CLIENT EVENTS ***/

client.on('ready', () => {
    consola.success(`Logged in as ${client.user.tag} at ${Date()}`);
    mongo.init().then(() => { syncUsers(guild); })
    startServer();
    const Guilds = client.guilds.cache.map(guild => guild.name);
    let guild = client.guilds.cache.get(process.env.guildId);
    setInterval(() => { syncUsers(guild); }, 1800000);
    guild.channels.cache.get(process.env.errorChannel).send({ embeds: [{ color: 0x00ff00, title: `Bot Initialized <t:${Math.trunc(Date.now() / 1000)}:R>`, description: `Commands: ${client.commands.size}\nAutoReplies: ${client.replies.length}\nServers: ${client.guilds.cache.size}`, fields: [{ name: "Server List", value: `${Guilds.join('\n')}` }] }] })
});

client.on('presenceUpdate', async (oldMember, newMember) => { client.events.find(event => event.name === "presenceUpdate").execute(oldMember, newMember) });

client.on('messageCreate', async (message) => {
    // consola.info(client.replies);
    client.events.find(event => event.name === "messageCreate").execute(message, client.replies)
});

client.on('messageReactionAdd', async (reaction, user) => { client.events.find(event => event.name === "messageReactionAdd").execute(reaction, user) });

client.on('interactionCreate', async interaction => {
    // if (!interaction.isChatInputCommand()) return;
    if (interaction.isSelectMenu()) {
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
            mongo.commandCounter(interaction.commandName)
            await command.execute(interaction);
        } catch (error) {
            consola.error(error);
            await interaction.reply({ title: "Error", content: 'There was an error while executing this command!', ephemeral: true });
            let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
            await interaction.member.guild.channels.cache.get(process.env.errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
        }
    } else if (interaction.isButton()) {
        try {
            await client.interactions.get(interaction.customId.split('|')[0]).execute(interaction);
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
    // consola.info("Track:", track)
    // consola.info("Queue Options", queue.options);
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
