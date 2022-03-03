const Discord = require('discord.js');
const auth = require('./tokens.json');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const deploy = require('./deploy-commands.js');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MEMBERS]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} at`);
    console.log(Date())
});

client.on('presenceUpdate', async(oldMember, newMember) => {
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
                try { newMember.member.roles.add("932816700305469510") } catch (e) { console.log("An error occurred while adding role. ", e) } // Add Cider User role.
            }
        } catch (e) {
            console.log("An error occurred. ", e)
        }

    } else { // Remove role if exists or ignore.
        try {
            if (newMember.member._roles.includes("932784788115427348")) {
                try {
                    newMember.member.roles.remove("932784788115427348"); // remove listening on cider role
                } catch (e) { console.log("An error occurred on role removal. ", e) }
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
    let link = message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)
    if (!link) return
    console.log("[Link] Creating redirect embed.")
    try {
        fetch(link).catch(e => console.log("[Link] Error creating redirect embed."))
            .then(result => result.text()).catch(e => null)
            .then(html => {
                const $ = cheerio.load(html)
                const title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('meta[name="title"]').attr('content')
                const description = $('meta[property="twitter:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content')
                const image = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content')
                let modlink = link[0].replace('https://', '')
                let play_link = "https://cider.sh/p?" + modlink
                let view_link = "https://cider.sh/o?" + modlink
                let embed = new Discord.MessageEmbed()
                    .setColor('#fb003f')
                    .setTitle(title)
                    .setURL(link.toString())
                    .setThumbnail(image)
                    .setDescription(description)
                    .setFooter({ text: "Shared by " + message.author.username, iconURL: message.author.avatarURL() })
                    .setTimestamp()
                let interaction = new Discord.MessageActionRow()
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
})
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    if (commandName === 'nightly' || commandName === 'branchbuilds') {
        let branch = interaction.options.getString('branch') || 'main'
        let show = interaction.options.getBoolean('show') || true
        let latestNightly = await fetch(`https://circleci.com/api/v1.1/project/gh/ciderapp/Cider/latest/artifacts?branch=${branch}&filter=successful`)
        if (latestNightly.status != 200) return interaction.reply(`Error fetching latest artifact from the **${branch}** branch`)
        latestNightly = await latestNightly.json()
            //console.log(latestNightly)
        let buttons = new Discord.MessageActionRow()
        latestNightly.forEach(element => {
            if (String(element.path).split('.')[String(element.path).split('.').length - 1] == 'yml') return;
            else if (String(element.path).split('.')[String(element.path).split('.').length - 1] == 'blockmap') return;
            else if (String(element.path).split('-')[String(element.path).split('-').length - 2] == 'winget') return;
            buttons.addComponents(
                new Discord.MessageButton()
                .setLabel(`.${String(element.path).split('.')[String(element.path).split('.').length - 1]}`)
                .setStyle('LINK')
                .setURL(element.url)
            )
        })
        if (typeof interaction.options.getBoolean('show') == 'undefined') { show = false } else { show = interaction.options.getBoolean('show') }
        await interaction.reply({ content: `What installer do you want from the **${branch}** branch?`, ephemeral: !show, components: [buttons] })
    } else {
        if (commandName === 'macos') {
            let buttons = new Discord.MessageActionRow()
            buttons.addComponents(
                new Discord.MessageButton()
                .setLabel(`.dmg (Universal)`)
                .setStyle('LINK')
                .setURL('https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.dmg')
            )
            buttons.addComponents(
                new Discord.MessageButton()
                .setLabel(`.pkg (Universal)`)
                .setStyle('LINK')
                .setURL('https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.pkg')
            )
           
            if (typeof interaction.options.getBoolean('show') == 'undefined') { show = false } else { show = interaction.options.getBoolean('show') }
            await interaction.reply({ content: `Listing available macOS installation packages.`, ephemeral: !show, components: [buttons]})
        } else {
            if (commandName === 'sauceme') {
                let saucerequest = await fetch('https://api.waifu.im/random/?selected_tags=hentai')
                let sauce = await saucerequest.json()
                let buttons = new Discord.MessageActionRow()
                let saucecontent = await sauce.images[0].url;
                let sauceart = await sauce.images[0].source;
                let saucecolor = await sauce.images[0].dominant_color;
                buttons.addComponents(
                    new Discord.MessageButton()
                    .setLabel("Open in Browser")
                    .setStyle('LINK')
                    .setURL(saucecontent.toString())
                )
                buttons.addComponents(
                    new Discord.MessageButton()
                    .setLabel("Open Artist/Source in Browser")
                    .setStyle('LINK')
                    .setURL(sauceart.toString())
                )
                let embed = new Discord.MessageEmbed()
                    .setColor(saucecolor.toString())
                    .setTitle("Sauce Randomizer")
                    .setURL(saucecontent.toString())
                    .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
                    .setImage(saucecontent.toString())
                    .setTimestamp()

                await interaction.reply({ content: `feeling down bad are we?`, embeds: [embed], ephemeral: true, components: [buttons]})
            } else {
                if (commandName === 'marin') {
                    let marinrequest = await fetch('https://api.waifu.im/random/?selected_tags=marin-kitagawa')
                    let marin = await marinrequest.json()
                    let buttons = new Discord.MessageActionRow()
                    let marincontent = await marin.images[0].url;
                    let marinart = await marin.images[0].source;
                    let marincolor = await marin.images[0].dominant_color;
                    buttons.addComponents(
                        new Discord.MessageButton()
                        .setLabel("Open in Browser")
                        .setStyle('LINK')
                        .setURL(marincontent.toString())
                    )
                    buttons.addComponents(
                        new Discord.MessageButton()
                        .setLabel("Open Artist/Source in Browser")
                        .setStyle('LINK')
                        .setURL(marinart.toString())
                    )
                    let embed = new Discord.MessageEmbed()
                        .setColor(marincolor.toString())
                        .setTitle("Marin, my beloved.")
                        .setURL(marincontent.toString())
                        .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
                        .setImage(marincontent.toString())
                        .setTimestamp()
    
                    await interaction.reply({ content: `marin best girl <3`, embeds: [embed], ephemeral: true, components: [buttons]})
                }
            }
        }
    }
})
client.login(auth.token).then();
