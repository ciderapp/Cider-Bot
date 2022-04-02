const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const oc_token = require('../local.js').ocKey()
const fetch = require('node-fetch');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify you donation status (OpenCollective only)')
        .addStringOption(option => option.setName('transaction_id')
            .setDescription('Open Collective transaction id')
            .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.reply({content: 'Not implemented yet', ephemeral: true})

        /*
        await interaction.reply('Verifying your donation status...');
        let transactionId = interaction.options.getString('transaction_id');
        let ocResult = await fetch(`https://api.opencollective.com/v1/collectives/ciderapp/transactions/${transactionId}?access_token=${oc_token}`)
        ocResult = await ocResult.json()
        console.log(ocResult)
        */
    },
};