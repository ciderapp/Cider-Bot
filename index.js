const { Client, Collection, Intents } = require('discord.js');
const Discord = require('discord.js');
let auth = require('./local').token()
let express = require('./integrations/express')
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const deploy = require('./deploy-commands.js');
const { MessageEmbed } = require('discord.js');
const mongo = require('../integrations/mongo.js');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MEMBERS]
});


client.commands = new Collection();
const fs = require('node:fs');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}


let cider_guild = "843954443845238864"

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} at`);
    console.log(Date())
    mongo.init()
});



client.on('presenceUpdate', async(oldMember, newMember) => {
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
                songName: activity.details
            }

            if (newMember.member._roles.includes("932784788115427348")) { // user already has listening role, no need to change roles
                console.log("\x1b[2m", "Listener updated -", listenerinfo)
                return // not changing any roles, just a log
            } else {
                console.log('\x1b[35m%s\x1b[0m', "Listener added -", listenerinfo)
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
                } catch (e) {
                    console.log("An error occurred while adding role. ", e)
                } // Add Cider User role.
            }
        } catch (e) {
            console.log("An error occurred. ", e)
        }

    } else { // Remove role if exists or ignore.
        try {
            if (newMember.member._roles.includes("932784788115427348")) {
                try {
                    newMember.member.roles.remove("932784788115427348"); // remove listening on cider role
                } catch (e) {
                    console.log("An error occurred on role removal. ", e)
                }
                let rmlistenerinfo = {
                    userid: newMember.userId,
                    userName: newMember.member.user.username,
                    dateRemoved: Date()
                }
                console.log("\x1b[33m%s\x1b[0m", "Listener removed -", rmlistenerinfo)
            }
        } catch (e) {
            console.log(e)
        }
    }
})

client.on('messageCreate', async message => {
    if (message.author.bot) return

    if (String(message).includes('turn on lossless') || String(message).includes('is lossless')) {
        const embed = new Discord.MessageEmbed()
        .setColor('#fb003f')
        .setTitle("Notice on Lossless Support in Cider")
        .setDescription("Lossless playback is not currently supported in Cider. This is due to MusicKit not having lossless capability.")
        .setFooter({ text: "Requested by " + message.author.username, iconURL: message.author.avatarURL() })
        .setTimestamp()
        return message.channel.send({ embeds: [embed] });
    } else if (message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)) {
        const link = message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)
        console.log("[Link] Creating redirect embed.")
        try {
            fetch(link).catch(e => console.log("[Link] Error creating redirect embed."))
                .then(result => result.text()).catch(e => null)
                .then(html => {
                    const $ = cheerio.load(html)
                    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('meta[name="title"]').attr('content')
                    const description = $('meta[property="twitter:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content')
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
                    } catch (e) {}
                }).catch(e => null)
        } catch (e) {}
    }

    


})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});
client.login(auth)
exports.client = client


// Reload Commands to take into account branch changes
// 20 minutes in milliseconds
setInterval(() => { const deploy = require('./deploy-commands.js'); }, 1200000)
