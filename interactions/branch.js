const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const Discord = require("discord.js");
const fetch = require("node-fetch");
module.exports = {
    data: { name: 'branch'},
    async execute(interaction) {
        console.log(interaction.user.username+"#"+interaction.user.discriminator+" with UserID: "+interaction.user.id +" used branchbuild");
        let branch = interaction.values[0].split('|')[0];
        let show = interaction.values[0].split('|')[1] == 'true' || false
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