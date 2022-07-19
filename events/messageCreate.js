import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { mongo } from '../integrations/mongo.js';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

export const event = {
    name: 'messageCreate',

    async execute(message, replies) {
        const overrideRegex = new RegExp(/^\!/g);
        const lRatio = (reaction, user) => {
            return reaction.emoji.name === "🇱"
        };
        const collector = message.createReactionCollector({ lRatio, time: 30000 })

        collector.once('collect', (reaction, user) => {
            if (reaction.emoji.name === "🇱") {
                message.reply({ files: [{ attachment: 'https://github.com/ciderapp/Cider-Bot/blob/main/assets/lRatio.mp4?raw=true', name: 'lRatio.mp4' }] })
            }
        });
        if (message.author.bot) return;
        
        if(message.channel.id === '952324765807439883') { // marin channel
            if(message.content != 'marin') {
                await message.delete();
                let reply = await message.channel.send({ content: `${message.author}, This is a marin chain channel, You are only allowed to send messages with the word \`marin\`.` })
                setTimeout(() => reply.delete(), 10000) // delete message after 10 seconds
            }
        }
        if(message.mentions.has(message.client.user)) {
            await message.reply ({ content: 'https://images-ext-1.discordapp.net/external/DgDEJfcfyMf0mxs09pQw0vLuyIbug6BCZabCBkZ4IuI/https/pbs.twimg.com/media/FX2mvLlUEAACH-q.jpg' })
        }
    }

}
