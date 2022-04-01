const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const Discord = require("discord.js");
const fetch = require("node-fetch");
// const { addDonation } = require('./mongo.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('branchbuilds')
        .setDescription('Gives you download links for the latest builds of a specified branch')
        .addBooleanOption(option => option.setName('show')
            .setDescription('Show to everyone!')
            .setRequired(false)
        ),
    async execute(interaction) {
        
        await fetch('https://api.github.com/repos/ciderapp/cider/branches').then(async (branches) => {
            let show = interaction.options.getBoolean('show') || false
            branches = await branches.json()
            let components = []
            branches.forEach(branch => {
                let component = {}
                component["label"] = branch.name
                component["value"] = branch.name + "|" + interaction.options.getBoolean('show') || false
                components.push(component)
            })
            let branchMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                .setCustomId('branch')
                .setPlaceholder('Select a branch')
                .addOptions(components)
            )
            await interaction.reply({ content: 'Please select a branch:', ephemeral: true, components: [branchMenu]});
        })
    }
}
