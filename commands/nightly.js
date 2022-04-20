const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    data:  new SlashCommandBuilder()
        .setName('nightly')
        .setDescription('Gives you download links for the latest nightly builds')
        .addBooleanOption(option => option.setName('show')
            .setDescription('Show to everyone!')
            .setRequired(false)
        ),
    async execute(interaction) {
        let branch = interaction.options.getString('branch') || 'develop';
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
    },
};
