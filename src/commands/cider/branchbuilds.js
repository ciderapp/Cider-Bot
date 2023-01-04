import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

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
    category: 'Cider',
    async execute(interaction) {
        let ping = interaction.options.getUser('ping') || "";
        let show = interaction.options.getBoolean('show') || false
        if (ping != "") { ping = ping.toString() }
        let branchMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('branch')
                    .setPlaceholder('Select a branch')
                    .addOptions([
                        {
                            label: 'main',
                            description: 'Cider(Nightly) compiled from main branch',
                            value: `main|${show}|${ping}`,
                        },
                        {
                            label: 'stable',
                            description: 'Cider compiled from stable branch (synced w/ MSFT store)',
                            value: `stable|${show}|${ping}`,
                        }
                    ])
            )
        if (ping != "" && (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802'))) {
            await interaction.reply({ content: `${ping} Choose your branch:`, components: [branchMenu] });
        }
        else {
            await interaction.reply({ content: `Choose your branch:`, ephemeral: !show, components: [branchMenu] });
            if (ping != "") {
                await interaction.followUp({ content: `You do not have the permission to ping users.`, ephemeral: true, components: [] })
            }
        }
    }
}