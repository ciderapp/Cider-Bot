import { EmbedBuilder } from "discord.js";
import 'dotenv/config';
import { autoreply, vaporId } from "../data/roles.js";
import leaks from '../data/leaks.json' assert { type: 'json'};
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
        let randnumber = Math.floor(Math.random() * 101);
        if (message.guildId == process.env.guildId && !message.member._roles.includes("848363050205446165")) {
            consola.info(randnumber);
            if (randnumber === 69) await leakCider2(message);
        }
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
async function leakCider2(message) {
    // get number of messages in leakchannel
    let { client } = await import('../index.js');
    if (client.canLeak) {
        const leakchannel = message.guild.channels.resolve(process.env.leakChannel)
        const messages = await leakchannel.messages.fetch()
        await leakchannel.send({
            embeds: [new EmbedBuilder()
                .setColor(0xf21f52)
                .setDescription(`${message.author} has unlocked a Cider 2 leak: **${leaks[messages.size].name}**`)
                .setAuthor({
                    name: `${client.user.username} | Cider 2 Leaks`,
                    iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
                })
                .setImage(leaks[messages.size].url)
            ]
        })
        client.canLeak = false;
        setTimeout(() => { client.canLeak = true }, 60000) // 1 minute
    }
}
