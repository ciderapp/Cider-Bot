import 'dotenv/config';
import { resolveColor } from 'discord.js';

export const event = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (reaction.message.guildId == "1016681050291847278" && !user.bot) {
            let member = await reaction.message.guild.members.fetch(user.id);
            if (reaction.emoji.name == "🐶") { // S13 - G1
                await member.roles.add("1020573508566274070");
                await member.roles.add("1020574208947933234");
            } else if (reaction.emoji.name == "🐱") { // S13 - G2
                await member.roles.add("1020573508566274070");
                await member.roles.add("1020574321137164370");
            } else if (reaction.emoji.name == "🐭") { // S13 - G3
                await member.roles.add("1020573508566274070");
                await member.roles.add("1020574355832442944");
            } else if (reaction.emoji.name == "🐰") { // S14 - G1
                await member.roles.add("1020573694847897651");
                await member.roles.add("1020574384311771166");
            } else if (reaction.emoji.name == "🦊") { // S14 - G2
                await member.roles.add("1020573694847897651");
                await member.roles.add("1020574411478282260");
            } else if (reaction.emoji.name == "🐻") { // S14 - G3
                await member.roles.add("1020573694847897651");
                await member.roles.add("1020574434647617636");
            } else { return }
            await member.roles.remove("1020580042310434857");
        }
        if (reaction.message.guildId !== process.env.guildId) return;
        consola.info("\x1b[33m%s\x1b[0m", '[messageReactionAdd]', `${user.tag} reacted with ${reaction.emoji.name} `, user);
        const dev_channel = "848224563673694250";
        const handleStarboard = async () => {
            const starboard = reaction.client.channels.cache.get(process.env.starboardChannel);
            const msgs = await starboard.messages.fetch({ limit: 100 });
            const existingMsg = msgs.find(msg =>
                msg.embeds.length === 1 ?
                    (msg.embeds[0].footer.text.startsWith(reaction.message.id) ? true : false) : false);
            if (existingMsg) existingMsg.edit(`⭐ **${reaction.count}** ${reaction.message.channel}`);
            else {
                const embeds = [{
                    color: resolveColor('Random'),
                    author: { name: reaction.message.author.username, icon_url: reaction.message.author.avatarURL() },
                    description: `${reaction.message.content}`,
                    fields: [{ name: "Source", value: `[Jump!](${reaction.message.url})` }],
                    timestamp: reaction.message.createdAt,
                    image: { url: `${reaction.message.attachments.first() ? reaction.message.attachments.first().url : ""}` },
                    footer: { text: `${reaction.message.id}` }
                }]
                if (starboard)
                    starboard.send({ content: `⭐ **${reaction.count}** ${reaction.message.channel}`, embeds });
            }
        }
        if (reaction.message.channel.id != dev_channel && reaction.emoji.name === '⭐' && (reaction.count >= 3 || reaction.client.guilds.cache.get(process.env.guildId).members.cache.get(user.id)._roles.includes("848363050205446165"))) {
            if (reaction.message.channel == reaction.client.channels.cache.get(process.env.starboardChannel)) return;
            if (reaction.message.partial) {
                await reaction.fetch();
                await reaction.message.fetch();
                handleStarboard();
            }
            else
                handleStarboard();
        }
    }
}