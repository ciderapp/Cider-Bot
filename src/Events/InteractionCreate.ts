const { MessageEmbed } = require('discord.js');
import { Event } from '../Typings/Event.js';
import { Mongo } from '../Integrations/Mongo';

export const event: Event = {
	event: 'interactionCreate',
	async run(bot, interaction) {
		if (!interaction.isCommand()) return;

		const command = bot.commands.get(interaction.commandName);
		if (!command) return;

		if (
			command.permission &&
			!interaction.member.permissions.has(command.permission)
		)
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(bot.config.color)
						.setDescription(
							`You require the \`${command.permission}\` to run this command.`
						),
				],
			});

		try {
			await command.run({
				interaction,
				bot,
				options: interaction.options,
				guild: interaction.guild,
			});

			Mongo.commandCounter(command.name)
		} catch (err) {
			bot.logger.error(err);

			await interaction[
				interaction.deferred
					? 'editReply'
					: interaction.replied
					? 'followUp'
					: 'reply'
			]({
				embeds: [
					new MessageEmbed()
						.setColor(bot.config.color)
						.setDescription(`Unexpected error: ${err}`),
				],
			});
		}
	},
};
