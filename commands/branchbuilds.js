const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const Discord = require("discord.js");
const fetch = require("node-fetch");
const { syncReleaseData } = require('../integrations/mongo'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('branchbuilds')
        .setDescription('Gives you download links for the latest builds of a specified branch')
        .addBooleanOption(option => option.setName('show')
            .setDescription('Show to everyone!')
            .setRequired(false)
        )
        .addUserOption(option => option.setName('ping')
        .setDescription('User to respond to (for use by Dev Team and Moderators only)')
            .setRequired(false)
        ),
    async execute(interaction) {
        let ping = interaction.options.getUser('ping')  || "";
        if(ping != ""){ ping = ping.toString() }
        let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases?per_page=100`)
        releases = await releases.json()
        await fetch('https://api.github.com/repos/ciderapp/cider/branches').then(async (branches) => {
            let show = interaction.options.getBoolean('show') || false
            branches = await branches.json()

            let components = []
            branches.forEach(branch => {
                syncReleaseData(branch, releases)
                let component = {}
                component["label"] = branch.name
                component["value"] = branch.name + "|" + (interaction.options.getBoolean('show') || false) + "|" + ping;
                components.push(component)
            })
            let branchMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                .setCustomId('branch')
                .setPlaceholder('Select a branch')
                .addOptions(components)
            )
            if(ping !="" && (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802'))){
                await interaction.reply({ content: `${ping} Choose your branch:`, components: [branchMenu]});
            }
            else{
                await interaction.reply({ content: `Choose your branch:`, ephemeral: !show, components: [branchMenu]});
                if(ping != ""){
                    await interaction.followUp({ content: `You do not have the permission to ping users.`, ephemeral: true, components: [] })
                }
            }        
        })
    }
}
