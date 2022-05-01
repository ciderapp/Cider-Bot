const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const Discord = require("discord.js");
const fetch = require("node-fetch");
const { syncReleaseData, syncReleaseLinks, getLatestRelease } = require('../integrations/mongo');
module.exports = {
    data: { name: 'branch' },
    async execute(interaction) {
        let timeStamp = new Date().toTimeString().split(' ')[0];
        console.log(timeStamp + " - " + interaction.user.username + "#" + interaction.user.discriminator + " with UserID: " + interaction.user.id + " used branchbuild");
        let branch = interaction.values[0].split('|')[0];
        let show = interaction.values[0].split('|')[1] == 'true' || false
        let user = interaction.values[0].split('|')[2] || "";
        let buttons = new Discord.MessageActionRow()
        let buttonsMac = new Discord.MessageActionRow()
        let release = null;
        await syncReleaseData(branch).then(async() => { 
            await getLatestRelease(branch).then(branchrelease => {
                release = branchrelease;
            }).catch(err => { console.log(err) })
        }).catch(async() => { console.log("Mongo Not Available. \n" + e) });
        try{
            if (release) {
                buttons.addComponents(
                    new Discord.MessageButton().setLabel("AppImage").setStyle('LINK').setURL(`${release.links.AppImage}`),
                    new Discord.MessageButton().setLabel("exe").setStyle('LINK').setURL(`${release.links.exe}`),
                    new Discord.MessageButton().setLabel("deb").setStyle('LINK').setURL(`${release.links.deb}`),
                    new Discord.MessageButton().setLabel("snap").setStyle('LINK').setURL(`${release.links.snap}`)
                )
                if(branch == "develop") {
                    buttonsMac.addComponents(
                    new Discord.MessageButton().setLabel("macos-dmg").setStyle('LINK').setURL(`${release.links.dmg}`),
                    new Discord.MessageButton().setLabel("macos-pkg").setStyle('LINK').setURL(`${release.links.pkg}`)
                    )
                }
                if (user != "" && (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802'))) {
                    if(buttonsMac.components.length == 0) {
                        await interaction.reply({ content: `${user}, What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nUpdated: ${release.lastUpdated}`, components: [buttons] })
                    } else {
                        await interaction.reply({ content: `${user}, What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nUpdated: ${release.lastUpdated}`,  components: [buttons, buttonsMac] })
                    }
                }
                else {
                    if(buttonsMac.components.length == 0) {
                        await interaction.reply({ content: `What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nUpdated: ${release.lastUpdated}`, ephemeral: !show, components: [buttons] })
                    } else {
                        await interaction.reply({ content: `What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nUpdated: ${release.lastUpdated}`, ephemeral: !show, components: [buttons, buttonsMac] })
                    }
                }
            }
            else{
                await interaction.reply({ content: `I have failed to retrieve any installers from the **${branch}** branch.`, ephemeral: !show })
            }
        }
        catch(e){
            console.log("Branch Interaction Failed ", e)
        }
        
    }
}