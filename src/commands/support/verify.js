import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { mongo } from '../../integrations/mongo.js';
import fetch from 'node-fetch';

export const command = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify you donation status (Open Collective only)')
        .addStringOption(option => option.setName('email')
            .setDescription('Email used')
            .setRequired(true)
        ),
    category: 'Support',
    async execute(interaction) {
        await interaction.reply({ content: 'Verifying your Donation/s from OpenCollective...', ephemeral: true });

        let email = interaction.options.getString('email');

        if (await emailExists(email, interaction.user.id)) {
            let ocResult = await fetch(`https://api.opencollective.com/v1/collectives/ciderapp/transactions/?apiKey=` + process.env.ocKey);
            ocResult = await ocResult.json();
            let donations = ocResult.result.filter(transaction => transaction.type !== 'DEBIT' && transaction.createdByUser && transaction.createdByUser.email === email);

            if (donations.length === 0) {
                await interaction.editReply({ content: 'You have not donated to CiderApp', ephemeral: true });
            } else {
                let embed = new EmbedBuilder()
                    .setTitle('Your donations')
                    .setColor('Random');
                donations.forEach(donation => {
                    embed.addFields({
                        name: donation.createdAt,
                        value: `Initial Donation: \`${donation.amount / 100}\` ${donation.hostCurrency}
          Payment Processor Fee: \`${donation.paymentProcessorFeeInHostCurrency / 100}\` ${donation.hostCurrency}
          Received Amount: \`${donation.netAmountInCollectiveCurrency / 100}\` ${donation.hostCurrency}
        `});
                    mongo.addDonation(donation, interaction.member.id);
                });
                if (interaction.guild.id === '843954443845238864') {
                    embed.setFooter({ text: 'Your role should be given to you shortly' });
                    try {
                        interaction.guild.members.cache.get(interaction.member.id).roles.add('923351772532199445');
                        interaction.guild.members.cache.get(interaction.member.id).roles.add('932811694751768656');
                    } catch (error) {
                        // console.log(error)
                    }
                }
                mongo.addEmail(email, interaction.user.id);

                await interaction.editReply({ content: "Thank you for donating to Cider!", embeds: [embed], ephemeral: true });
            }
        } else {
            await interaction.editReply({ content: "Sorry, we couldn't verify your donation. Please make sure you have entered the correct email.", ephemeral: true });
        }
    },
};