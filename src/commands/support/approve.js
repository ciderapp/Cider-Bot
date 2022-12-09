import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName('approve').setDescription('Approve a user as donator').addUserOption(option => option.setName('user').setDescription('User to approve').setRequired(true)).addStringOption(option => option.setName('platform').setDescription('Platform user donated on').setRequired(true).addChoices({ name: 'OpenCollective', value: 'oc' }, { name: 'Kofi', value: 'kofi' }, { name: 'GitHub', value: 'github' }, { name: 'Alpha Channel', value: 'alpha' })),
    category: 'Support',
    async execute(interaction) {
        if (!interaction.member._roles.includes('928845681517535323') || !interaction.member._roles.includes('848363050205446165')) {
            return interaction.reply({ content: 'You do not have permission to approve.', ephemeral: true });
        } else {
            const user = interaction.options.getUser('user');
            const platform = interaction.options.getString('platform');

            await interaction.guild.members.cache.get(user.id).roles.add('932811694751768656')

            switch (platform) {
                case 'oc':
                    await interaction.guild.members.cache.get(user.id).roles.add("923351772532199445");
                    break;
                case 'kofi':
                    await interaction.guild.members.cache.get(user.id).roles.add("905457688211783690");
                    break;
                case 'github':
                    await interaction.guild.members.cache.get(user.id).roles.add("990362567241236490");
                    break;
                case 'alpha':
                    await interaction.guild.members.cache.get(user.id).roles.add("1050089837648162886");
                    break;
            }

            await interaction.reply({ content: `${user.tag} has been approved.` });
        }
    },
};