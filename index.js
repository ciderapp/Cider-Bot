const { Client, Collection, Intents } = require('discord.js');
const Discord = require('discord.js');
let auth = require('./local').token()
let express = require('./integrations/express')
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const consola = require('consola');
// const deploy = require('./deploy-commands.js');
const { MessageEmbed } = require('discord.js');
const mongo = require('./integrations/mongo');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MEMBERS]
});

client.commands = new Collection();
client.interactions = new Collection();
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

let cider_guild = "843954443845238864"
let totalUsers, activeUsers;

client.on('ready', () => {
    consola.success(`Logged in as ${client.user.tag} at ${Date()}`);
    mongo.init()
    const guild = client.guilds.cache.get(cider_guild)
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

});

client.on('presenceUpdate', async (oldMember, newMember) => {
    //If role not found in guild, do nothing.
    try { if (oldMember.guild.id !== cider_guild || newMember.guild.id !== cider_guild) return } catch (e) { return }
    // or else it'll go BONK

    const role = newMember.guild.roles.cache.get("932784788115427348");

    let using_cider = false
    for (const activity of newMember.activities) {
        // 911790844204437504 - Cider
        // 886578863147192350 - Apple Music
        if (activity && (activity.applicationId === ("911790844204437504") || (activity.applicationId === ("886578863147192350")))) {
            let listenerinfo = {
                userid: newMember.userId,
                userName: newMember.member.user.username,
                songName: activity.details,
                artistName: String(activity.state).split("by ")[1],
            }
            mongo.logRPMetadata(listenerinfo)

            if (newMember.member._roles.includes("932784788115427348")) { // user already has listening role, no need to change roles
                consola.info("\x1b[2m", "Listener updated -", listenerinfo)
                return // not changing any roles, just a log
            } else {
                consola.info('\x1b[35m%s\x1b[0m', "Listener added -", listenerinfo)
                try {
                    mongo.incrementActiveUsers().then(() => {
                        mongo.getActiveUsers().then(users => {
                            activeUsers = users;
                            client.user.setActivity(`${activeUsers} / ${totalUsers} Active Cider Users`, { type: 'WATCHING' });
                        })
                    })
                } catch (e) {
                    consola.error("An error occurred. ", e)
                }
                using_cider = true // code below will handle it
                break
            }
        }
    }
    if (using_cider) {
        try {
            newMember.member.roles.add(role) // add listening on cider role
            if (!newMember.member._roles.includes("932816700305469510")) {
                try {
                    newMember.member.roles.add("932816700305469510")
                    mongo.incrementTotalUsers().then(() => {
                        mongo.getTotalUsers().then(users => {
                            totalUsers = users;
                            client.user.setActivity(`${activeUsers} / ${totalUsers} Active Cider Users`, { type: 'WATCHING' });
                        })
                    })
                } catch (e) {
                    consola.error("An error occurred while adding role. ", e)
                } // Add Cider User role.
            }
        } catch (e) {
            consola.error("An error occurred. ", e)
        }

    } else { // Remove role if exists or ignore.
        try {
            if (newMember.member._roles.includes("932784788115427348")) {
                try {
                    newMember.member.roles.remove("932784788115427348"); // remove listening on cider role
                } catch (e) {
                    consola.error("An error occurred on role removal. ", e)
                }
                let rmlistenerinfo = {
                    userid: newMember.userId,
                    userName: newMember.member.user.username,
                    dateRemoved: Date()
                }
                consola.info("\x1b[33m%s\x1b[0m", "Listener removed -", rmlistenerinfo)
                try {
                    mongo.decrementActiveUsers().then(() => {
                        mongo.getActiveUsers().then(users => {
                            activeUsers = users;
                            client.user.setActivity(`${activeUsers} / ${totalUsers} Active Cider Users`, { type: 'WATCHING' });
                        })
                    })
                } catch (e) {
                    consola.error("An error occurred. ", e)
                }
            }
        } catch (e) {
            consola.error(e)
        }
    }
})

client.on('messageCreate', async message => {
    const overrideRegex = new RegExp(/^\!/g);
    const textRegex = new RegExp(/(test)/g);
    const faqupdateRegex = new RegExp(/(faqupdate)/g);
    if (message.author.bot) return
    /* Chenge Apple Music Link */
    if (message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)) {
        const link = message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)
        consola.info("[Link] Creating redirect embed.")
        try {
            fetch(link).catch(e => console.log("[Link] Error creating redirect embed."))
                .then(result => result.text()).catch(e => null)
                .then(html => {
                    const $ = cheerio.load(html)
                    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('meta[name="title"]').attr('content')
                    const metadescription = $('meta[property="twitter:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content')
                    const description = metadescription.replace(/年年/g, "年")
                    const image = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content')
                    const modlink = link[0].replace('https://', '')
                    const play_link = "https://cider.sh/p?" + modlink
                    const view_link = "https://cider.sh/o?" + modlink
                    const embed = new Discord.MessageEmbed()
                        .setColor('#fb003f')
                        .setTitle(title)
                        .setURL(link.toString())
                        .setThumbnail(image)
                        .setDescription(description)
                        .setFooter({ text: "Shared by " + message.author.username, iconURL: message.author.avatarURL() })
                        .setTimestamp()
                    const interaction = new Discord.MessageActionRow()
                        .addComponents(
                            new Discord.MessageButton()
                                .setLabel('Play In Cider')
                                .setStyle('LINK')
                                .setURL(play_link),
                            new Discord.MessageButton()
                                .setLabel('View In Cider')
                                .setStyle('LINK')
                                .setURL(view_link)
                        )
                    try {
                        message.delete()
                        return message.channel.send({ embeds: [embed], components: [interaction] });
                    } catch (e) { consola.error(e) }
                }).catch(e => null)
        } catch (e) { }
        /* Auto Replies */
    } else if ((!message.member._roles.includes("848363050205446165") && !message.member._roles.includes("932811694751768656") && !message.member.id.includes("345021804210814976")) || overrideRegex.test(message.toString())) { // exclude dev team and donators
        for (reply of replies) {
            var regex = new RegExp(`\\b${reply.name}\\b`, "gi");
            if (regex.test(message.toString())) {
                console.success("\x1b[32m%s\x1b[0m", "[Reply] ", `triggered: ${reply.name}`)
                mongo.replyCounter(reply.name)
                message.react("✅")
                const embed = new Discord.MessageEmbed()
                    .setColor(reply.color)
                    .setTitle(`${reply.title}`)
                    .setDescription(`${reply.description}`)
                    .setFooter({ text: "Requested by " + message.member.user.username, iconURL: message.member.user.avatarURL() })
                    .setTimestamp()
                message.reply({ embeds: [embed] }).then(msg => {
                    setTimeout(() => msg.delete(), reply.timeout)
                })
            }
            if (reply.aliases) {
                for (var i = 0; i < reply.aliases.length; i++) {
                    var regex = new RegExp(`\\b${reply.aliases[i]}\\b`, "gi");
                    if (regex.test(message.toString())) {
                        console.success("\x1b[32m%s\x1b[0m", "[Reply] ", `triggered: ${reply.name}`)
                        mongo.replyCounter(reply.name)
                        message.react("✅")
                        const embed = new Discord.MessageEmbed()
                            .setColor(reply.color)
                            .setTitle(`${reply.title}`)
                            .setDescription(`${reply.description}`)
                            .setFooter({ text: "Requested by " + message.member.user.username, iconURL: message.member.user.avatarURL() })
                            .setTimestamp()
                        message.reply({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), reply.timeout)
                        })
                    }
                }
            }
        }
    }
})

client.on('interactionCreate', async interaction => {
    //if (!interaction.isCommand()) return;
    if (interaction.isSelectMenu()) {
        if (!client.interactions.get(interaction.customId)) return;
        try {
            await client.interactions.get(interaction.customId).execute(interaction);
        } catch (error) {
            consola.error(error);
            await client.interactions.get(interaction.customId).reply({ content: 'There was an error while executing this command!', ephemeral: true });
            errorEmbed = { description: `${error.name}`, fields: [{ name: 'Message',  value: error.message }, { name: 'Origin', value: error.trace }]}
            await interaction.member.guild.channels.cache.get("911395772803735612").send({ content: `There was an error executing ${interaction.name}`, embeds: [errorEmbed] })
        }
    } else if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            mongo.commandCounter(interaction.commandName)
            await command.execute(interaction);
        } catch (error) {
            consola.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            errorEmbed = { description: `${error.name}`, fields: [{ name: 'Message',  value: error.message }, { name: 'Origin', value: error.trace }]}
            await interaction.member.guild.channels.cache.get("911395772803735612").send({ content: `There was an error executing ${interaction.name}`, embeds: [errorEmbed] })
        }
    }
});
client.login(auth)

process.on('unhandledRejection', error => {
    consola.error(error);
    errorEmbed = { description: `${error.name}`, fields: [{ name: 'Message',  value: error.message }, { name: 'Origin', value: error.trace }]}
    client.channels.cache.get("911395772803735612").send({ content: `There was an error`, embeds: [errorEmbed] })
})
process.on('uncaughtException', error => {
    consola.error(error);
    errorEmbed = { description: `${error.name}`, fields: [{ name: 'Message',  value: error.message }, { name: 'Origin', value: error.trace }]}
    client.channels.cache.get("911395772803735612").send({ content: `There was an error`, embeds: [errorEmbed] })
})
