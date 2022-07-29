import { EmbedBuilder } from "discord.js";
import 'dotenv/config';
import { autoreply, vaporId } from "../data/roles.js";
import { mongo } from '../integrations/mongo.js';

export const event = {
    name: 'messageCreate',

    async execute(message, replies) {
        const overrideRegex = new RegExp(/^\!/g);

        if (message.author.bot) return;
        const lRatio = (reaction) => { return reaction.emoji.name === "🇱" };
        const collector = message.createReactionCollector({ lRatio, time: 60000 })
        collector.once('collect', (reaction, user) => {
            if (reaction.emoji.name === "🇱") {
                message.reply({ files: [{ attachment: 'https://user-images.githubusercontent.com/71800112/181668217-8f13ae27-9619-4381-8749-074a78c092c1.mp4', name: 'lRatio.mp4' }] })
            }
        });

        /* Auto Replies */
        if ((message.guildId == process.env.guildId && !autoreply.test(message.member._roles.toString()) && !vaporId.test(message.member.id.toString())) || overrideRegex.test(message.toString())) { // exclude dev team and donators
            for (let reply of replies) {
                var regex = new RegExp(`(?=.*Cider)(?=.*${reply.name})`, "gi");
                if (regex.test(message.toString()) && !message.content.startsWith("https://")) {
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
                        var regex = new RegExp(`(?=.*Cider)(?=.*${reply.aliases[i]})`, "gi");
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

        if (message.channel.id === '952324765807439883') { // marin channel
            if (message.content != 'marin') {
                await message.delete();
                let reply = await message.channel.send({ content: `${message.author}, This is a marin chain channel, You are only allowed to send messages with the word \`marin\`.` })
                setTimeout(() => reply.delete(), 10000) // delete message after 10 seconds
            }
        }
        if (message.mentions.has(message.client.user)) {
            await message.reply({ content: 'https://images-ext-1.discordapp.net/external/DgDEJfcfyMf0mxs09pQw0vLuyIbug6BCZabCBkZ4IuI/https/pbs.twimg.com/media/FX2mvLlUEAACH-q.jpg' })
        }
    }

}
/* Change Apple Music Link */
/*
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
                if (json.statusCode !== 400 && json.linksByPlatform.appleMusic) {
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
                    message.reply({ content: "Sorry, this song cannot be played in Cider. / Spotify Playlists are not currently supported yet" })
                }
            })
    } catch (e) { consola.error(e) }
}
*/