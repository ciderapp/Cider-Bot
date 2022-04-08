const { Client, Collection, Intents } = require('discord.js');
const Discord = require('discord.js');
let auth = require('./local').token()
let express = require('./integrations/express')
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const deploy = require('./deploy-commands.js');
const { MessageEmbed } = require('discord.js');
const mongo = require('./integrations/mongo');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MEMBERS]
});


client.commands = new Collection();
client.interactions = new Collection();
const fs = require('node:fs');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
    console.log("Registered Command: ", command.data.name);
}
const interactionFiles = fs.readdirSync('./interactions').filter(file => file.endsWith('.js'));
for (const file of interactionFiles) {
    const interaction = require(`./interactions/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.interactions.set(interaction.data.name, interaction);
    console.log("Registered Interaction: ", interaction.data.name);
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
                songName: activity.details,
                artistName: String(activity.state).split("by ")[1],
            }
            mongo.logRPMetadata(listenerinfo)

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
    const losslessRegex = new RegExp(/(lossless)/gi);
    const slowRegex = new RegExp(/(slow)/gi);
    if (message.author.bot) return

    if(!message.member.roles.toString().includes("848363050205446165") && !message.member.roles.toString().includes("8932811694751768656")) {
        if (slowRegex.test(message.toString())) {
        
            const embed = new Discord.MessageEmbed()
            .setColor('#fb003f')
            .setTitle("Why is Cider Slow?")
            .setDescription("Cider is slow because its not taking full advantage of your hardware. To turn on, do <:KeyCtrl:830276580835721239> (or ⌘) <:KeyComma:830276581036523561> <a:righter_arrow:509735362994896924> “Advanced” <a:righter_arrow:509735362994896924> “Enable Hardware Acceleration” <a:righter_arrow:509735362994896924> “WebGPU”")
            message.reply("<:KeyCtrl:830276580835721239>")
            message.reply({ embeds: [embed] }).then(reply => {
                setTimeout(() => reply.delete(), 20000)
            })
    
        } else if (losslessRegex.test(message.toString())) {
            
            const embed = new Discord.MessageEmbed()
            .setColor('#fb003f')
            .setTitle("Lossless Audio in Cider")
            .setDescription("Lossless playback is not currently supported in Cider. Apple's MusicKit Framework does have lossless support, however, decryption of this audio is not supported.")
            message.reply({ embeds: [embed] }).then(reply => {
                setTimeout(() => reply.delete(), 12000)
            })
        }
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
        mongo.commandCounter(interaction.commandName)
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isSelectMenu()) return;
    const iAction = client.interactions.get(interaction.customId);
    if (!iAction) return;
    try {
        await iAction.execute(interaction);
    } catch (error) {
        console.error(error);
        await iAction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});
client.login(auth)
