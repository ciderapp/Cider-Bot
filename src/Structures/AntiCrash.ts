import { Bot } from './BotClient' 
import { codeBlock } from '@discordjs/builders';
import { inspect } from 'util';
import { TextChannel, MessageEmbedOptions } from 'discord.js';

export class AntiCrash {
    constructor(private bot: Bot) {}
    
    async init() {
        const { bot } = this;

        /* Fatal Crash Error */
        process.on('unhandledRejection', async (reason, promise) => {
            bot.logger.fatal('Anti-Crash\nUnhandled Rejection / Catch', reason, promise);

            this.log({
                description: 'Unhandled Rejection / Catch',
                fields: [
                    {
                        name: 'Reason',
                        value: codeBlock('js', inspect(reason))
                    },
                    {
                        name: 'Promise',
                        value: codeBlock('js', inspect(promise))
                    }
                ]
            })
        })

        process.on('uncaughtException', (err, origin) => { 
            bot.logger.fatal('Anti-Crash\nUncaught Exception / Catch', err, origin);

            this.log({
                description: 'Unhandled Rejection / Catch',
                fields: [
                    {
                        name: 'Error',
                        value: codeBlock('js', inspect(err))
                    },
                    {
                        name: 'Origin',
                        value: codeBlock('js', inspect(origin))
                    }
                ]
            })
        })
    }
    
    async log(options: MessageEmbedOptions) {
        const { bot } = this;

        const Channel = (await bot.channels.cache.get(bot.config.errorLogChannel)) as TextChannel | null;
        if (!Channel) return this.bot.logger.error("Couldn't reach error channel! Please fill all the properties required in BotConfig.ts")

        await Channel.send({
            embeds: [options]
        })
    } 
}