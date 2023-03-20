import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMemberRoleManager, StringSelectMenuInteraction } from 'discord.js';
import { firebase } from '../integrations/firebase.js';
import consola from 'consola';

export const interaction = {
    data: { name: 'branch' },
    async execute(interaction: StringSelectMenuInteraction) {
        await interaction.update({ content: 'Generating Releases...', components: [] });
        consola.info(interaction.user.username + '#' + interaction.user.discriminator + ' with UserID: ' + interaction.user.id + ' used branchbuild');
        let branch = interaction.values[0].split('|')[0];
        let show = interaction.values[0].split('|')[1] == 'true' || false;
        let user = interaction.values[0].split('|')[2] || '';
        let memberRoles = (interaction.member!.roles as GuildMemberRoleManager).cache;
        let buttons = new ActionRowBuilder();
        let buttonsMac = new ActionRowBuilder();
        let release = null;
        await firebase.syncReleaseData(branch);
        release = await firebase.getLatestRelease(branch);
        consola.info('Release: ', release);
        if (release != null && release.ready != false) {
            if (release.links.AppImage) buttons.addComponents(new ButtonBuilder().setLabel('AppImage').setStyle(ButtonStyle.Link).setURL(`${release.links.AppImage}`));
            if (release.links.exe) buttons.addComponents(new ButtonBuilder().setLabel('exe').setStyle(ButtonStyle.Link).setURL(`${release.links.exe}`));
            if (release.links.deb) buttons.addComponents(new ButtonBuilder().setLabel('deb').setStyle(ButtonStyle.Link).setURL(`${release.links.deb}`));
            if (release.links.snap) buttons.addComponents(new ButtonBuilder().setLabel('snap').setStyle(ButtonStyle.Link).setURL(`${release.links.snap}`));
            if (release.links.dmg) buttonsMac.addComponents(new ButtonBuilder().setLabel('macos-dmg').setStyle(5).setURL(`${release.links.dmg}`));
            if (release.links.pkg) buttonsMac.addComponents(new ButtonBuilder().setLabel('macos-pkg').setStyle(5).setURL(`${release.links.pkg}`));
            if (release.links.uwp) buttons.addComponents(new ButtonBuilder().setLabel('UWP-Package').setStyle(ButtonStyle.Link).setURL(`${release.links.uwp}`));
            let components = [buttons];
            if (buttonsMac.components.length > 0) components.push(buttonsMac);
            if ((user != '' && memberRoles.has(CiderGuildRoles.dev)) || memberRoles.has(CiderGuildRoles.moderator))
                return await interaction.editReply({
                    content: `${user}, What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nLast Updated: <t:${release.lastUpdated.seconds}:R>`, //@ts-ignore
                    components
                });
            return await interaction.editReply({
                content: `What installer do you want from the **${branch}** branch?\nVersion:  ${release.tag.slice(1)}\nLast Updated: <t:${release.lastUpdated.seconds}:R>`, //@ts-ignore
                components
            });
        } else if (release.ready == false) await interaction.editReply({ content: `The **${branch}** branch is currently being added to this bot, Check back later.` });
        else {
            await interaction.editReply({ content: `The **${branch}** branch requires self-compilation! Check [Cider Docs - Self-Compiling](https://docs.cider.sh/compilation/) for more information.` });
        }
    }
};
