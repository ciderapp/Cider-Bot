import { Command } from '../Typings/Command.js';
import { TextChannel } from 'discord.js';
import FAQembed from '../JSON/FAQ.json';

export const command: Command = {
	name: 'faqupdate',
	description: 'Updates the FAQ page.',
	options: [
		{
			name: 'publish',
			description: 'Updates when set to true.',
			required: false,
			type: 'BOOLEAN',
		},
	],
	async run({ interaction, options, guild }) {
		if (!interaction.member.roles.cache.has('848363050205446165')) return;

		let publish = options.getBoolean('publish') || false;
		if (publish) {
			const FAQchannel = guild.channels.cache.get(
				'911395772803735612'
			) as TextChannel;
			FAQchannel.send({ embeds: FAQembed.embeds });
			interaction.reply({ content: `${FAQchannel} page updated!` });
		} else {
			await interaction.reply({
				embeds: FAQembed.embeds,
				ephemeral: true,
			});
			await interaction.followUp({
				content: `To publish, set publish to \`true\``,
				ephemeral: true,
			});
		}
	},
};
