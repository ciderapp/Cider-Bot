const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const Discord = require("discord.js");
const fetch = require("node-fetch");
const consola = require('consola');
const { getLatestRelease } = require('../integrations/mongo')
module.exports = {
    data: { name: 'branch' },
    async execute(interaction) {
        consola.info(interaction.user.username + "#" + interaction.user.discriminator + " with UserID: " + interaction.user.id + " used branchbuild");
        let branch = interaction.values[0].split('|')[0];
        let show = interaction.values[0].split('|')[1] == 'true' || false
        let user = interaction.values[0].split('|')[2] || "";
        let buttons = new Discord.MessageActionRow()
        let buttonsMac = new Discord.MessageActionRow()
        let release = null;
        release = await getLatestRelease(branch)
        consola.info("Release: ",release);
        try {
            if (release) {
                buttons.addComponents(
                    new Discord.MessageButton().setLabel("AppImage").setStyle('LINK').setURL(`${release.links.AppImage}`),
                    new Discord.MessageButton().setLabel("exe").setStyle('LINK').setURL(`${release.links.exe}`),
                    new Discord.MessageButton().setLabel("deb").setStyle('LINK').setURL(`${release.links.deb}`),
                    new Discord.MessageButton().setLabel("snap").setStyle('LINK').setURL(`${release.links.snap}`)
                )
                if (branch == 'main') {
                    buttonsMac.addComponents(
                        new Discord.MessageButton().setLabel("macos-dmg").setStyle('LINK').setURL(`${release.links.dmg}`),
                        new Discord.MessageButton().setLabel("macos-pkg").setStyle('LINK').setURL(`${release.links.pkg}`)
                    )
                }
                if(branch == 'develop'){
                    await interaction.update({ content: `:warning: This branch is deprecated, please use main instead.`, ephemeral: true, components: [] });
                } else {
                    if (user != "" && (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802'))) {
                        if (buttonsMac.components.length == 0) {
                            await interaction.update({ content: `${user}, What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nLast Updated: <t:${release.jsDate / 1000}:R>`, components: [buttons] })
                        } else {
                            await interaction.update({ content: `${user}, What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nLast Updated: <t:${release.jsDate / 1000}:R>`, components: [buttons, buttonsMac] })
                        }
                    }
                    else {
                        if (buttonsMac.components.length == 0) {
                            await interaction.update({ content: `What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nLast Updated: <t:${release.jsDate / 1000}:R>`, components: [buttons] })
                        } else {
                            await interaction.update({ content: `What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nLast Updated: <t:${release.jsDate / 1000}:R>`, components: [buttons, buttonsMac] })
                        }
                    }
                }
            }
            else {
                await interaction.update({ content: `The **${branch}** branch requires self-compilation! Check [Cider Docs - Self-Compiling](https://docs.cider.sh/compilation/) for more information.`, ephemeral: !show, components: [] })
            }
        }
        catch (e) {
            consola.error("Branch Interaction Failed ", e)
        }

    }
}