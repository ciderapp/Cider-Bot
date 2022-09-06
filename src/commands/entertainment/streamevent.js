import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('streamevent')
        .setDescription('Instantiate the stream event.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    category: 'Entertainment',
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        let { client } = await import('../../index.js');
        client.discordTogether.createTogetherCode(interaction.member.voice.channelId, 'youtube').then(async invite => {
            return interaction.reply({content: invite.code, ephemeral: true});
        });
    }
}