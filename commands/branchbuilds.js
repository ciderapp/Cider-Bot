const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const Discord = require("discord.js");
const fetch = require("node-fetch");


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
            branches = await branches.json()
            let branchMenu = new SlashCommandStringOption().setName('branch').setDescription('The branch to get builds from.').setRequired(true);

            branches.forEach(branch => {
                branchMenu.addChoice(branch.name, branch.name)
            });
        })
        let branch = interaction.options.getString('branch') || 'main'
        let show = interaction.options.getBoolean('show') || false
        let buttons = new Discord.MessageActionRow()
        let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases`)
        releases = await releases.json()
        for (let release of releases) {
            if (String(release.name).split(' ')[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') === branch) {
                release = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases/${release.id}/assets`)
                release = await release.json()
                release.forEach(element => {
                    if (String(element.name).split('.')[String(element.name).split('.').length - 1] == 'yml') return;
                    else if (String(element.name).split('.')[String(element.name).split('.').length - 1] == 'blockmap') return;
                    else if (String(element.name).split('-')[String(element.name).split('-').length - 3] == 'winget') return;
                    buttons.addComponents(
                        new Discord.MessageButton()
                            .setLabel(`.${String(element.name).split('.')[String(element.name).split('.').length - 1]}`)
                            .setStyle('LINK')
                            .setURL(element.browser_download_url)
                    )
                })
                break;
            }
        }
        if (buttons.components.length == 0) {
            await interaction.reply({ content: `I have failed to retrieve any installers from the **${branch}** branch.`, ephemeral: !show })

        } else {
            await interaction.reply({ content: `What installer do you want from the **${branch}** branch?`, ephemeral: !show, components: [buttons] })
        }
    }
}
