import { Command } from '../Typings/Command.js';
import { MessageActionRow, MessageEmbed, MessageButton } from 'discord.js';
import fetch from 'node-fetch';

export const command: Command = {
	name: 'marin',
	description:
		'Sends a random picture of the one and only, our goddess; Marin Kitagawa.',
	async run({ interaction }) {
		const response = await fetch(
			'https://api.waifu.im/random/?selected_tags=marin-kitagawa'
		);
		const data = await response.json();

		interaction.reply({
			content: `marin best girl <3`,
			embeds: [
				new MessageEmbed()
					.setColor(data.images[0].dominant_color.toString())
					.setTitle(`Marin my beloved`)
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
