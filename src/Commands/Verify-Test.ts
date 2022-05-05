import { Command } from '../Typings/Command.js';
import { Mongo } from '../Integrations/Mongo';
import { MessageEmbed } from 'discord.js';
const fetch = require('node-fetch');
const ocToken = require('../Structures/Local').ocKey();

export const command: Command = {
	name: 'verifytest',
	description: 'Verify you donation status (OpenCollective only)',
	options: [
		{
			name: 'email',
			description: 'Email used.',
			required: true,
			type: 'STRING',
		},
	],
	async run({ interaction, options, bot, guild }) {
		const response = await fetch(
			`https://api.opencollective.com/v1/collectives/ciderapp/transactions/?apiKey=${ocToken}`
		);
		const data = await response.json();
		let donations: any[] = [];
		data.result.forEach(
			(transaction: {
				type: string;
				createdByUser: { email: string | null };
			}) => {
				if (transaction.type === 'DEBIT') return;
				if (!transaction.createdByUser) return;
				if (transaction.createdByUser.email !== options.getString('email'))
					return;
				donations.push(transaction);
			}
		);

		if (donations.length === 0) {
			interaction.reply({
				content: 'You have not donated to Cider yet!',
				ephemeral: true,
			});
			return;
		} else {
			const embed = new MessageEmbed()
				.setColor(bot.config.color)
				.setTitle('Your donation(s)')
				.setTimestamp();
			donations.forEach(donation => {
				embed.addField(
					`${donation.createdAt}`,
					`Initial Donation: \`${donation.amount / 100}\` ${
						donation.hostCurrency
					}\nPayment Processor Fee \`${
						donation.paymentProcessorFeeInHostCurrency / 100
					}\` ${donation.hostCurrency}\nReceived Amount: \`${
						donation.netAmountInCollectiveCurrency / 100
					}\` ${donation.hostCurrency}`
				);
				Mongo.addDonation(donation, interaction.user.id);
			});
			if (guild.id === '843954443845238864') {
				embed.setFooter({
					text: `Thanks for donating! Your role should be given to you shortly.`,
				});
				guild.members.cache.get(interaction.user.id)?.roles.add('923351772532199445');
				guild.members.cache.get(interaction.user.id)?.roles.add('932811694751768656');
			}
			interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		}
	},
};
