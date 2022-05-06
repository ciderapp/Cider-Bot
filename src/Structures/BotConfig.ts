import { Config } from '../Typings/Config.js';
import { Intents } from 'discord.js';

export const config: Config = {
	color: '#ff2654',
	botOptions: {
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_MEMBERS,
			Intents.FLAGS.GUILD_PRESENCES,
		],
		allowedMentions: {
			parse: ['users'],
			repliedUser: true,
		},
		failIfNotExists: false,
		partials: ['CHANNEL'],
	},
	errorLogChannel: '972138658230579210', // Cider Server: 972138457893851176
};
