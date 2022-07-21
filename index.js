import { Client, GatewayIntentBits, Partials, Collection, ActivityType, resolveColor } from "discord.js"; // Define Client, Intents, and Collection
import consola from 'consola';
import { app } from './integrations/express.js';
import { mongo } from './integrations/mongo.js';
import { guildId, errorChannel, token } from './local.js';
import { Musicord, SongSearcher } from 'musicord';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

client.commands = new Collection();
client.interactions = new Collection();
client.category = new Collection();
client.events = [];
client.replies = [];
client.totalUsers = 0;
client.activeUsers = 0;
client.canPingKeefe = true;
client.musicordPlayer = new Musicord();
client.SongSearcher = new SongSearcher();
export { client };

import { readdirSync } from 'fs';
// Import Command Files
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const { command } = await import(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Command:", command.data.name, command?.category);
}
// Import Interaction files
const interactionFiles = readdirSync('./interactions').filter(file => file.endsWith('.js'));
for (const file of interactionFiles) {
    const { interaction } = await import(`./interactions/${file}`);
    client.interactions.set(interaction.data.name, interaction);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Interaction:", interaction.data.name);
}
// Import Autoreply files
const replyFiles = readdirSync('./replies').filter(file => file.endsWith('.json'));
for (const file of replyFiles) {
    let { default: reply } = await import(`./replies/${file}`, { assert: { type: 'json' } });
    client.replies.push(reply);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Reply:", reply.name);
}
// Import Event files
const eventFiles = readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    let { event } = await import(`./events/${file}`);
    client.events.push(event);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Event:", event.name);
}


client.on('ready', () => {
    consola.success(`Logged in as ${client.user.tag} at ${Date()}`);
    mongo.init()
    const Guilds = client.guilds.cache.map(guild => guild.name);
    let guild = client.guilds.cache.get(guildId);
    if (guild) {
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
    guild.channels.cache.get(errorChannel).send({ embeds: [{ color: 0x00ff00, title: `Bot Initialized <t:${Math.trunc(Date.now() / 1000)}:R>`, description: `Commands: ${client.commands.size}\nAutoReplies: ${client.replies.length}\nServers: ${client.guilds.cache.size}`, fields: [{ name: "Server List", value: `${Guilds.join('\n')}` }] }] })
});
client.login(token);

/* Event Handlers */
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
            await interaction.member.guild.channels.cache.get(errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
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
            await interaction.member.guild.channels.cache.get(errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
        }
    }
});

process.on('unhandledRejection', error => {
    consola.error(error);
    consola.error(error.stack);
    let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
    client.channels.cache.get(errorChannel).send({ content: `Unhandled Rejection`, embeds: [errorEmbed] })
})
process.on('uncaughtException', error => {
    consola.error(error);
    consola.error(error.stack);
    let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
    client.channels.cache.get(errorChannel).send({ content: `Uncaught Exception`, embeds: [errorEmbed] })
})
