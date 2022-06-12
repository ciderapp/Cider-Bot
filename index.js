const { Client, Intents, Collection, MessageActionRow, MessageEmbed, MessageButton } = require("discord.js"); // Define Client, Intents, and Collection.
let auth = require('./local').token()
let express = require('./integrations/express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const consola = require('consola');
const mongo = require('./integrations/mongo');
const cider_guild = require('./local').guildId();
const errorChannel = require('./local').errorChannel();
const starboardChannel = require('./local').starboardChannel();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});

client.commands = new Collection();
client.interactions = new Collection();
client.events = [];
replies = [];
const fs = require('node:fs');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Command:", command.data.name);
}
const interactionFiles = fs.readdirSync('./interactions').filter(file => file.endsWith('.js'));
for (const file of interactionFiles) {
    const interaction = require(`./interactions/${file}`);
    // Set a new item in the Collection
    // With the key as the interaction name and the value as the exported module
    client.interactions.set(interaction.data.name, interaction);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Interaction:", interaction.data.name);
}
const replyFiles = fs.readdirSync('./replies').filter(file => file.endsWith('.json'));
for (const file of replyFiles) {
    let reply = require(`./replies/${file}`);
    // Set a new item in the Collection
    // With the key as the reply name and the value as the exported module
    replies.push(reply);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Reply:", reply.name);
}
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    let event = require(`./events/${file}`);
    // Set a new item in the Collection
    // With the key as the reply name and the value as the exported module
    client.events.push(event);
    consola.info("\x1b[32m%s\x1b[0m", "Registered Event:", event.name);
}


let guild = null
let totalUsers, activeUsers;

client.on('ready', () => {
    consola.success(`Logged in as ${client.user.tag} at ${Date()}`);
    mongo.init()
    const Guilds = client.guilds.cache.map(guild => guild.name);
    guild = client.guilds.cache.get(cider_guild)
    if (guild) {
        mongo.setActiveUsers(guild.roles.cache.get("932784788115427348").members.size)
        mongo.setTotalUsers(guild.roles.cache.get("932816700305469510").members.size)
        mongo.getActiveUsers().then(users => {
            activeUsers = users;
            mongo.getTotalUsers().then(users => {
                totalUsers = users;
                client.user.setActivity(`${activeUsers} / ${totalUsers} Active Cider Users`, { type: 'WATCHING' });
                consola.info(`Total Users: ${totalUsers} | Active Users: ${activeUsers}`)
            })
        })
    }
    guild.channels.cache.get(errorChannel).send({ embeds: [{ color: "#00ff00", title: `Bot Initialized <t:${Math.trunc(Date.now() / 1000)}:R>`, description: `Commands: ${client.commands.size}\nAutoReplies: ${replies.length}\nServers: ${client.guilds.cache.size}`, fields: [{ name: "Server List", value: `${Guilds.join('\n')}` }] }] })
});
client.login(auth);

/* Event Handlers */
client.on('presenceUpdate', async (oldMember, newMember) => { client.events.find(event => event.name === "presenceUpdate").execute(oldMember, newMember) });

client.on('messageCreate', async (message) => { client.events.find(event => event.name === "messageCreate").execute(message) });

client.on('messageReactionAdd', async (reaction, user) => { client.events.find(event => event.name === "messageReactionAdd").execute(reaction, user) });

client.on('interactionCreate', async interaction => {
    //if (!interaction.isCommand()) return;
    if (interaction.isSelectMenu()) {
        if (!client.interactions.get(interaction.customId)) return;
        try {
            await client.interactions.get(interaction.customId).execute(interaction);
        } catch (error) {
            consola.error(error);
            await client.interactions.get(interaction.customId).reply({ content: 'There was an error while executing this command!', ephemeral: true });
            errorEmbed = { color: "#ff0000", title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
            await interaction.member.guild.channels.cache.get(errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
        }
    } else if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            mongo.commandCounter(interaction.commandName)
            await command.execute(interaction);
        } catch (error) {
            consola.error(error);
            await interaction.reply({ title: "Error", content: 'There was an error while executing this command!', ephemeral: true });
            errorEmbed = { color: "#ff0000", title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
            await interaction.member.guild.channels.cache.get(errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
        }
    }
});

process.on('unhandledRejection', error => {
    consola.error(error);
    consola.error(error.stack);
    errorEmbed = { color: "#ff0000", title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
    client.channels.cache.get(errorChannel).send({ content: `Unhandled Rejection`, embeds: [errorEmbed] })
})
process.on('uncaughtException', error => {
    consola.error(error);
    consola.error(error.stack);
    errorEmbed = { color: "#ff0000", title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
    client.channels.cache.get(errorChannel).send({ content: `Uncaught Exception`, embeds: [errorEmbed] })
})
