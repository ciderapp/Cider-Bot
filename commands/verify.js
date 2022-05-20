const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const oc_token = require('../local.js').ocKey()
const mongo = require('../integrations/mongo.js')
const fetch = require('node-fetch');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify you donation status (Open Collective only)')
        .addStringOption(option => option.setName('email')
            .setDescription('Email used')
            .setRequired(true)
        ),
    async execute(interaction) {
        //await interaction.reply({content: 'Not implemented yet', ephemeral: true})
        let email = interaction.options.getString('email');
        let ocResult = await fetch(`https://api.opencollective.com/v1/collectives/ciderapp/transactions/?apiKey=` + oc_token)
        ocResult = await ocResult.json();
        let donations = []
        ocResult.result.forEach(transaction => {
            if (transaction.type === 'DEBIT') return;
            if (!transaction.createdByUser) return;
            if (transaction.createdByUser.email !== email) return;
            donations.push(transaction)
        })
        if (donations.length === 0) {
            await interaction.reply({content: 'You have not donated to CiderApp', ephemeral: true})
        } else {
            let embed = new Discord.MessageEmbed()
            embed.setTitle('Your donations')
            embed.setColor('#0099ff')
            embed.setDescription('')
            donations.forEach(donation => {
                embed.addField( donation.createdAt, `
                Initial Donation: \`${donation.amount / 100}\` ${donation.hostCurrency}
                Payment Processor Fee: \`${donation.paymentProcessorFeeInHostCurrency / 100}\` ${donation.hostCurrency}
                Received Amount: \`${donation.netAmountInCollectiveCurrency / 100}\` ${donation.hostCurrency}
                `)
                mongo.addDonation(donation, interaction.member.id)
            })
            if (interaction.guild.id === '843954443845238864'){
                embed.setFooter('Your role should be given to you shortly')
                try {
                    interaction.guild.members.cache.get(interaction.member.id).roles.add('923351772532199445')
                    interaction.guild.members.cache.get(interaction.member.id).roles.add('932811694751768656')
                } catch (error) {
                    //console.log(error)
                }
            }

            await interaction.reply({content: "Thank you for donating to Cider!", embeds: [embed], ephemeral: true})
        }
    },
};
