import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { mongo } from '../integrations/mongo.js'
import consola from 'consola';


export const interaction = {
    data: { name: 'branch' },
    async execute(interaction) {
        consola.info(interaction.user.username + "#" + interaction.user.discriminator + " with UserID: " + interaction.user.id + " used branchbuild");
        let branch = interaction.values[0].split('|')[0];
        let show = interaction.values[0].split('|')[1] == 'true' || false
        let user = interaction.values[0].split('|')[2] || "";
        let buttons = new ActionRowBuilder()
        let buttonsMac = new ActionRowBuilder()
        let release = null;
        release = await mongo.getLatestRelease(branch)
        consola.info("Release: ", release);
        try {
            if (release) {
                buttons.addComponents(
                    new ButtonBuilder().setLabel("AppImage").setStyle(ButtonStyle.Link).setURL(`${release.links.AppImage}`),
                    new ButtonBuilder().setLabel("exe").setStyle(ButtonStyle.Link).setURL(`${release.links.exe}`),
                    new ButtonBuilder().setLabel("deb").setStyle(ButtonStyle.Link).setURL(`${release.links.deb}`),
                    new ButtonBuilder().setLabel("snap").setStyle(ButtonStyle.Link).setURL(`${release.links.snap}`)
                )
                if (release.links.dmg && release.links.dmg) {
                    buttonsMac.addComponents(
                        new ButtonBuilder().setLabel("macos-dmg").setStyle(5).setURL(`${release.links.dmg}`),
                        new ButtonBuilder().setLabel("macos-pkg").setStyle(5).setURL(`${release.links.pkg}`)
                    )
                }
                if (branch == 'develop') {
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