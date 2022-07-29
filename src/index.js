import { Client, GatewayIntentBits, Partials, Collection, ActivityType, resolveColor } from "discord.js"; // Define Client, Intents, and Collection
import consola from 'consola';
import { mongo } from './integrations/mongo.js';
import 'dotenv/config';
import { Musicord, SongSearcher } from 'musicord';
import { readdirSync } from 'fs';
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
client.musicordPlayer = new Musicord();
client.SongSearcher = new SongSearcher();
client.commands = new Collection();
client.interactions = new Collection();
client.replies = [];
client.events = [];
client.totalUsers = 0;
client.activeUsers = 0;
client.canPingKeefe = true;

export { client };

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

async function syncUsers() {
    let guild = client.guilds.cache.get("843954443845238864");
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

/***  CLIENT EVENTS ***/

client.on('ready', () => {
    consola.success(`Logged in as ${client.user.tag} at ${Date()}`);
    mongo.init()
    const Guilds = client.guilds.cache.map(guild => guild.name);
    let guild = client.guilds.cache.get(process.env.guildId);
    if (guild.id == "843954443845238864") { // if the bot sees the Cider guild
        syncUsers();
        setInterval(() => { syncUsers(); }, 1800000);
    }
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
