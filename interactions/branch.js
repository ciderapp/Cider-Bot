const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const Discord = require("discord.js");
const fetch = require("node-fetch");
module.exports = {
    data: { name: 'branch' },
    async execute(interaction) {
        let timeStamp = new Date().toTimeString().split(' ')[0];
        console.log(timeStamp + " - " + interaction.user.username + "#" + interaction.user.discriminator + " with UserID: " + interaction.user.id + " used branchbuild");
        let branch = interaction.values[0].split('|')[0];
        let show = interaction.values[0].split('|')[1] == 'true' || false
        let user = interaction.values[0].split('|')[2] || "";
        let buttons = new Discord.MessageActionRow()
        let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases?per_page=1000`)
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
        console.log(interaction.member)
        if (user != "" && (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802'))) {
            if (buttons.components.length == 0) {
                await interaction.reply({ content: `I have failed to retrieve any installers from the **${branch}** branch.`, ephemeral: !show })
            } else {
                await interaction.reply({ content: `${user}, What installer do you want from the **${branch}** branch?`, components: [buttons] })
            }
        }
        else {
            if (buttons.components.length == 0) {
                await interaction.reply({ content: `I have failed to retrieve any installers from the **${branch}** branch.`, ephemeral: !show })
            } else {
                await interaction.reply({ content: `What installer do you want from the **${branch}** branch?`, ephemeral: !show, components: [buttons] })
            }
        }
    }
}