import { MessageEmbed } from 'discord.js';
import { Command } from '../Typings/Command.js';

export const command: Command = {
	name: 'faq',
	description: 'Commonly Asked Questions and their answers.',
	options: [
		{
			name: 'questions',
			type: 'STRING',
			description: 'Questions',
			required: true,
			choices: [
				{
					name: 'Why is my Discord Rich Presence not working?',
					value: 'discord',
				},
				{
					name: 'Why is my Cider skipping songs?',
					value: 'restrictions',
				},
			],
		},
		{
			name: 'mention',
			description: 'Mention the user to respond to.',
			required: false,
			type: 'USER',
		},
	],
	async run({ interaction, options, bot }) {
		const user = options.getUser('mention') || interaction.user;
		const ephemeral = user === interaction.user ? true : false;
		let embed = new MessageEmbed()
			.setColor(bot.config.color)
			.setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}` })
			.setTimestamp();
		if (options.get('questions')?.value === 'discord') {
			embed.setTitle('Why is my Discord Rich Presence not working?')
			embed.setDescription(
				`Make sure that 'Display current activity as a status message' is enabled in your Activity Status category in the Discord settings. Cider will not appear as a game, so do not manually add it.\n\n If you are using Discord from the Snap Store, you are advised to install from a different source (Discords Website or using another package manager). The Snap Store version of Discord is known to have issues with DiscordRPC. \n\n Ensure that you are running Discord on a level that is below Cider. If Discord is being elevated, Cider will be unable to connect. Furthermore, ensure that Discord is started first. Cider has to connect to Discord and this is only done on Cider's launch. So **make sure Discord is started before Cider.**`
			);
			embed.setImage(
				'https://camo.githubusercontent.com/6c8838c5a50fc6f061ead8787e54e4367420bc3169ddbc37e524adb3180a7848/68747470733a2f2f692e696d6775722e636f6d2f337a6e664f4d682e706e67'
			);
		} else if (options.get('questions')?.value === 'restrictions') {
			embed.setTitle('Why is my Cider skipping songs?') 
			embed.setDescription(
				'Your account might have content restrictions set to "Clean"\n\n In order to check, go to [Apple Media Account settings](https://tv.apple.com/settings) and check the "Content Restrictions" section.\n\n Make sure that Music is set to `Explicit`'
			);
		}

		interaction.reply({
			content: `${user}`,
			embeds: [embed],
			ephemeral: ephemeral,
		});
	},
};
