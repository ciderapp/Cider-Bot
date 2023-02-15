import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { firebase } from '../integrations/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import consola from 'consola';

export const interaction = {
    data: { name: 'branch' },
    async execute(interaction) {
        await interaction.update({ content: "Generating Releases...", components: []})
        consola.info(interaction.user.username + "#" + interaction.user.discriminator + " with UserID: " + interaction.user.id + " used branchbuild");
        let branch = interaction.values[0].split('|')[0];
        let show = interaction.values[0].split('|')[1] == 'true' || false
        let user = interaction.values[0].split('|')[2] || "";
        let buttons = new ActionRowBuilder()
        let buttonsMac = new ActionRowBuilder()
        let release = null;
        await firebase.syncReleaseData(branch)
        release = await firebase.getLatestRelease(branch)
        consola.info("Release: ", release);
        if (release != null && release.ready != false) {
            if (release.links.AppImage) buttons.addComponents(new ButtonBuilder().setLabel("AppImage").setStyle(ButtonStyle.Link).setURL(`${release.links.AppImage}`))
            if (release.links.exe) buttons.addComponents(new ButtonBuilder().setLabel("exe").setStyle(ButtonStyle.Link).setURL(`${release.links.exe}`))
            if (release.links.deb) buttons.addComponents(new ButtonBuilder().setLabel("deb").setStyle(ButtonStyle.Link).setURL(`${release.links.deb}`))
            if (release.links.snap) buttons.addComponents(new ButtonBuilder().setLabel("snap").setStyle(ButtonStyle.Link).setURL(`${release.links.snap}`))
            if (release.links.dmg) buttonsMac.addComponents(new ButtonBuilder().setLabel("macos-dmg").setStyle(5).setURL(`${release.links.dmg}`))
            if (release.links.pkg) buttonsMac.addComponents(new ButtonBuilder().setLabel("macos-pkg").setStyle(5).setURL(`${release.links.pkg}`))
            if (release.links.uwp) buttons.addComponents(new ButtonBuilder().setLabel("UWP-Package").setStyle(ButtonStyle.Link).setURL(`${release.links.uwp}`))
            let components = [ buttons ]
            if (buttonsMac.components.length > 0) components.push(buttonsMac)
            if (user != "" && (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802'))) 
                return await interaction.editReply({ content: `${user}, What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nLast Updated: <t:${release.lastUpdated.seconds}:R>`, components })
            return await interaction.editReply({ content: `What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nLast Updated: <t:${release.lastUpdated.seconds}:R>`, components  })
        }
        else if(release.ready == false) await interaction.editReply({ content: `The **${branch}** branch is currently being added to this bot, Check back later.` })
        else {
            await interaction.editReply({ content: `The **${branch}** branch requires self-compilation! Check [Cider Docs - Self-Compiling](https://docs.cider.sh/compilation/) for more information.` })
        }
    }
}