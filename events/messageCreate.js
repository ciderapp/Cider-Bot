import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { mongo } from '../integrations/mongo.js';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

export const event = {
    name: 'messageCreate',

    async execute(message, replies) {
        const overrideRegex = new RegExp(/^\!/g);
        const profanityFilter = new RegExp(/fuck|shitty|bullshit|piss|cunt|tits|cock|bitch/gi)
        const lRatio = (reaction, user) => {
            return reaction.emoji.name === "🇱"
        };
        const collector = message.createReactionCollector({ lRatio, time: 30000 })

        collector.once('collect', (reaction, user) => {
            if (reaction.emoji.name === "🇱") {
                message.reply({ files: [{ attachment: 'https://github.com/ciderapp/Cider-Bot/blob/main/assets/lRatio.mp4?raw=true', name: 'lRatio.mp4' }] })
            }
        });
        if (message.author.bot) return

        if (message.member.guild.id == "843954443845238864" && !message.member._roles.includes("848363050205446165")) // if not dev team
        {
            if (message.content.match(profanityFilter)) {
                message.reply({ content: `${message.author} Hey, that's some spicy vocabulary you got there.  It has no place in this Christian family friendly server.  Try here instead: https://discord.gg/fNXzTB9FtW` })
                // delete after 10 seconds
                // setTimeout(() => {
                //     message.delete()
                // }, 10000);
            }
        }
        /* Change Apple Music Link */
        if (message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)) {
            const link = message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)
            consola.info("[Link] Creating redirect embed.")
            try {
                fetch(link).catch(e => consola.error("[Link] Error creating redirect embed."))
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
                        const embed = new EmbedBuilder()
                            .setColor('#fb003f')
                            .setTitle(title)
                            .setURL(link.toString())
                            .setThumbnail(image)
                            .setDescription(description)
                            .setFooter({ text: "Shared by " + message.author.username, iconURL: message.author.avatarURL() })
                            .setTimestamp()
                        const interaction = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setLabel('Play In Cider')
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(play_link),
                                new ButtonBuilder()
                                    .setLabel('View In Cider')
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(view_link)
                            )
                        try {
                            message.delete()
                            return message.channel.send({ embeds: [embed], components: [interaction] });
                        } catch (e) { consola.error(e) }
                    }).catch(e => consola.error("[Link] Error creating redirect embed.", e))
            } catch (e) { }
        } else if (message.content.match(/(open\.spotify\.com)([^\s]+)/gi)) {
            const link = message.content.match(/(open\.spotify\.com)([^\s]+)/gi)
            try {
                fetch("https://api.song.link/v1-alpha.1/links?url=" + link + "&userCountry=US").catch(e => consola.error("[Link] Error creating Spotify redirect embed."))
                    .then(result => result.json()).catch(e => null)
                    .then(json => {
                        if (json.linksByPlatform.appleMusic) {
                            const amlink = json.linksByPlatform.appleMusic.url
                            fetch(amlink).catch(e => consola.error("[Link] Error creating redirect embed."))
                                .then(result => result.text()).catch(e => null)
                                .then(html => {
                                    const $ = cheerio.load(html)
                                    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('meta[name="title"]').attr('content')
                                    const metadescription = $('meta[property="twitter:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content')
                                    const description = metadescription.replace(/年年/g, "年")
                                    const image = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content')
                                    const modlink = amlink.replace('https://', '')
                                    const play_link = "https://cider.sh/p?" + modlink
                                    const view_link = "https://cider.sh/o?" + modlink
                                    const embed = new EmbedBuilder()
                                        .setColor('#fb003f')
                                        .setTitle(title)
                                        .setURL(amlink.toString())
                                        .setThumbnail(image)
                                        .setDescription(description)
                                        .setFooter({ text: "Shared by " + message.author.username, iconURL: message.author.avatarURL() })
                                        .setTimestamp()
                                    const interaction = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setLabel('Play In Cider')
                                                .setStyle(ButtonStyle.Link)
                                                .setURL(play_link),
                                            new ButtonBuilder()
                                                .setLabel('View In Cider')
                                                .setStyle(ButtonStyle.Link)
                                                .setURL(view_link)
                                        )
                                    try {
                                        message.delete()
                                        return message.channel.send({ embeds: [embed], components: [interaction] });
                                    } catch (e) { consola.error(e) }
                                }).catch(e => null)
                        } else {
                            message.reply({ content: "Sorry, this song cannot be played in Cider." })
                        }
                    })
            } catch (e) { consola.error(e) }
            /* Auto Replies */
        } else if ((!message.member._roles.includes("848363050205446165") && !message.member._roles.includes("932811694751768656") && !message.member.id.includes("345021804210814976")) || overrideRegex.test(message.toString())) { // exclude dev team and donators
            for (let reply of replies) {
                var regex = new RegExp(`\\b${reply.name}\\b`, "gi");
                if (regex.test(message.toString())) {
                    consola.success("\x1b[32m%s\x1b[0m", "[Reply] ", `triggered: ${reply.name}`)
                    mongo.replyCounter(reply.name)
                    message.react("✅")
                    const embed = new EmbedBuilder()
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
                            consola.success("\x1b[32m%s\x1b[0m", "[Reply] ", `triggered: ${reply.name}`)
                            mongo.replyCounter(reply.name)
                            message.react("✅")
                            const embed = new EmbedBuilder()
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
        if(message.channel.id === '952324765807439883') { // marin channel
            if(message.content != 'marin') {
                reply = await message.channel.send({ content: `${message.user}, This is a marin chain channel, You are only allowed to send messages with the word \`marin\`.`, ephemeral: true })
                await message.delete()
                setTimeout(() => reply.delete(), 10000) // delete message after 10 seconds
            }
        }
    }

}
