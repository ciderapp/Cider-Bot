import { ActionRowBuilder, ChatInputCommandInteraction, GuildMemberRoleManager, SlashCommandBuilder, StringSelectMenuBuilder } from 'discord.js';

export const command = {
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
    category: 'General',
    async execute(interaction: ChatInputCommandInteraction) {
        let ping = interaction.options.getUser('ping') || "";
        let show = interaction.options.getBoolean('show') || false
        if (ping != "") { ping = ping.toString() }
        let memberRoles = (interaction.member!.roles as GuildMemberRoleManager).cache
        let components = new StringSelectMenuBuilder()
        .setCustomId('branch')
        .setPlaceholder('Select a branch')
        .addOptions([
            {
                label: 'Cider Classic (main)',
                description: 'Cider 1.x compiled from main branch',
                value: `main|${show}|${ping}`,
            },
            {
                label: 'Cider Classic (stable)',
                description: 'Cider 1.x compiled from stable branch (synced w/ MSFT store)',
                value: `stable|${show}|${ping}`,
            }
        ])
        if(process.env.NODE_ENV == "development" || memberRoles.has(CiderGuildRoles.donator)) components.addOptions([{ label: 'Cider 2 (Beta) - Electron' , description: 'Cider 2.x compiled with Electron', value: `cider2electron|${show}|${ping}`}])
        if(process.env.NODE_ENV == "development" || memberRoles.has(CiderGuildRoles.alpha)) components.addOptions([{ label: 'Cider 2 (Beta) - UWP' , description: 'Cider 2.x compiled with UWP', value: `cider2uwp|${show}|${ping}`}])
        let branchMenu = new ActionRowBuilder().addComponents(components)
        if (ping != "" && memberRoles.has(CiderGuildRoles.dev) || memberRoles.has(CiderGuildRoles.moderator)) { //@ts-ignore
            await interaction.reply({ content: `${ping} Choose your branch:`, components: [branchMenu] });
        }
        else { //@ts-ignore
            await interaction.reply({ content: `Choose your branch:`, ephemeral: !show, components: [branchMenu] });
            if (ping != "") {
                await interaction.followUp({ content: `You do not have the permission to ping users.`, ephemeral: true, components: [] })
            }
        }
    }
}