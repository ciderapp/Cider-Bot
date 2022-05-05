import { MessageActionRow, MessageEmbed, MessageButton } from 'discord.js';
import { Command } from '../Typings/Command.js';

export const command: Command = {
	name: 'donate',
	description: 'Displays information regarding donation.',
	options: [
		{
			name: 'mention',
			description: 'Mention the user to respond to.',
			required: false,
			type: 'USER',
		},
	],
	async run({ interaction, options, bot }) {
		const user = options.getUser('mention') || interaction.user;

		interaction.reply({
			content: `${user}`,
			embeds: [
				new MessageEmbed()
					.setTitle('Donate')
					.setDescription(
						`You can donate via our Open Collective Organization (<@&923351772532199445>) or via Ko-Fi (<@&905457688211783690>, <@&905457957486067843>). Whichever is most convenient for your country/payment method and both are eligible for a <@&932811694751768656> role.\n\n Some of us also have individual donation links, if you would rather support one person.\n\n  **Note: the payment processor might take a percentage of your donation before the rest reaches us!**`
					)
					.setColor(bot.config.color)
					.setTimestamp(),
			],
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setLabel('Open Collective')
						.setStyle('LINK')
						.setURL(`https://opencollective.com/ciderapp`),
					new MessageButton()
						.setLabel('Ko-fi')
						.setStyle('LINK')
						.setURL(`https://ko-fi.com/cryptofyre`),
					new MessageButton()
						.setLabel('Github Sponsors')
						.setStyle('LINK')
						.setURL(`https://github.com/sponsors/ciderapp`)
				),
			],
		});
	},
};
