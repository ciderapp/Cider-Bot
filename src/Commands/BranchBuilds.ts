import { Command } from '../Typings/Command.js';
import {
	MessageActionRow,
	MessageSelectMenu,
	MessageButton,
	SelectMenuInteraction,
} from 'discord.js';
import fetch from 'node-fetch';
import { Mongo } from '../Integrations/Mongo';

export const command: Command = {
	name: 'branchbuilds',
	description: 'Displays buttons that lead to various build installers.',
	options: [
		{
			name: 'mention',
			description: 'Mention the user to respond to.',
			required: false,
			type: 'USER',
		},
		{
			name: 'ephemeral',
			description: 'Send the message as an ephemeral (hidden) message.',
			required: false,
			type: 'BOOLEAN',
		},
	],
	async run({ interaction, options, bot }) {
		let ephemeral;
		if (options.getBoolean('ephemeral') == null || options.getBoolean('ephemeral') == true) {
			ephemeral = true;
		} else {
			ephemeral = false;
		}
		const response = await fetch(
			'https://api.github.com/repos/ciderapp/cider/branches'
		);
		const branches = await response.json();
		const components = Array();
		for (const branch of branches) {
			components.push({
				label: branch.name,
				value: branch.name,
			});
		}
		const interactionMessage = await interaction.reply({
			content: 'Pick a branch',
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('branch')
						.setPlaceholder('Pick a branch')
						.addOptions(components)
				),
			],
			fetchReply: true,
			ephemeral: ephemeral,
		});
		let collector = interactionMessage.createMessageComponentCollector();

		collector.on('collect', async (i: SelectMenuInteraction) => {
			if (i.user.id !== interaction.user.id) {
				return i.reply({
					content: `These components are not for you.`,
					ephemeral: true,
				});
			} else {
				type releaseData = {
					links: {
						AppImage: string;
						exe: string;
						deb: string;
						snap: string;
						dmg: string;
						pkg: string;
					};
					tag: string;
					jsDate: string;
				};
				const branch = i.values[0];
				await Mongo.syncReleaseData(branch);
				const release: releaseData | null = (await Mongo.getLatestRelease(
					branch
				).catch((err: any) => {
					bot.logger.error(err);
				})) as releaseData | null;

				let buttons = new MessageActionRow();
				let macButtons = new MessageActionRow();
				if (release) {
					buttons.addComponents(
						new MessageButton()
							.setLabel('AppImage')
							.setStyle('LINK')
							.setURL(`${release['links']['AppImage']}`),
						new MessageButton()
							.setLabel('exe')
							.setStyle('LINK')
							.setURL(`${release['links']['exe']}`),
						new MessageButton()
							.setLabel('deb')
							.setStyle('LINK')
							.setURL(`${release['links']['deb']}`),
						new MessageButton()
							.setLabel('snap')
							.setStyle('LINK')
							.setURL(`${release['links']['snap']}`)
					);
					if (branch == 'develop') {
						macButtons.addComponents(
							new MessageButton()
								.setLabel('macos-dmg')
								.setStyle('LINK')
								.setURL(`${release['links']['dmg']}`),
							new MessageButton()
								.setLabel('macos-pkg')
								.setStyle('LINK')
								.setURL(`${release['links']['pkg']}`)
						);
					}

					const time = `<t:${parseInt(release['jsDate']) / 1000}:R>`;
					if (macButtons.components.length > 0) {
						await i.update({
							content: `${
								options.getUser('mention') || interaction.user
							}, What installer do you want from the **${branch}** branch?\nVersion:  ${
								release['tag']
							} \nLast Updated: ${time}`,
							components: [buttons, macButtons],
						});
					} else {
						await i.update({
							content: `${
								options.getUser('mention') || interaction.user
							}, What installer do you want from the **${branch}** branch?\nVersion:  ${
								release['tag']
							} \nLast Updated: ${time}`,
							components: [buttons],
						});
					}
					bot.logger.success(`[Commands]: ${i.user.id} used branchbuilds on ${i.values[0]} branch.`)
				} else {
					await i.update({
						content: `I have failed to retrieve any installers from the **${branch}** branch.`,
						components: [],
					});
					bot.logger.warn(`[Commands]: ${i.user.id} used branchbuilds on ${i.values[0]} branch.`)
				}
			}
		});
	},
};