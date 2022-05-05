import { Command } from '../Typings/Command.js';
import { MessageActionRow, MessageEmbed, MessageButton } from 'discord.js';
import fetch from 'node-fetch';

export const command: Command = {
	name: 'sauceme',
	description: 'Sends a random extra saucy image (18+)',
	async run({ interaction }) {
		const response = await fetch(
			'https://api.waifu.im/random/?selected_tags=hentai'
		);
		const data = await response.json();

		interaction.reply({
			content: `feeling down bad are we?`,
			embeds: [
				new MessageEmbed()
					.setColor(data.images[0].dominant_color.toString())
					.setTitle(`Sauce Randomizer`)
					.setURL(data.images[0].url.toString())
					.setFooter({
						text: `Requested by ${interaction.user.username}`,
						iconURL: `${interaction.user.avatarURL()}`,
					})
					.setImage(data.images[0].url.toString())
					.setTimestamp(),
			],
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setLabel('Open in Browser')
						.setStyle('LINK')
						.setURL(data.images[0].url.toString()),
					new MessageButton()
						.setLabel('Open Artist/Source in Browser')
						.setStyle('LINK')
						.setURL(data.images[0].source.toString())
				),
			],
			ephemeral: true,
		});
	},
};
