const { Client, Collection } = require('discord.js');
const consola = require('consola');
import { Config } from '../Typings/Config.js';
require('dotenv').config();
import { Command } from '../Typings/Command.js';
import { Event } from '../Typings/Event.js';
import { promisify } from 'util';
import glob from 'glob';

export class Bot extends Client {
	constructor(public config: Config) {
		super(config.botOptions);
		this.config = config;
		this.commands = new Collection();
		this.logger = consola;
		this.search = promisify(glob);
		this.bot = this;
	}

	async start() {
		await this.loadOperations();
		await this.login(process.env.TOKEN);

		/* // Use this if you want Slash commands to be guild-only
		const guild = this.guilds.cache.get(this.config.guildId);
		await guild.commands.set(this.commands);
		*/
		await this.application.commands.set(this.commands); // Use this if you want the Slash commands to be global.
	}

	async loadOperations() {
		const commands = await this.search(`${__dirname}/../Commands/*{.js,.ts}`);
		commands.forEach(async (commandName: string) => {
			const command: Command = (await import(commandName)).command;
			this.commands.set(command.name, command);
			this.logger.info(
				'\x1b[32m%s\x1b[0m',
				'Registered Command: ',
				command.name
			);
		});

		this.logger.info(`${commands.length} Commands Loaded.`);

		const events = await this.search(`${__dirname}/../Events/*{.js,.ts}`);
		events.forEach(async (eventName: string) => {
			const event: Event = (await import(eventName)).event;

			if (event.once)
				this.bot.once(event.event, event.run.bind(null, this.bot));
			else this.bot.on(event.event, event.run.bind(null, this.bot));
		});

		this.logger.info(`${events.length} Events Loaded.`);
	}
}
