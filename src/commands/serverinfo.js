import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName("serverinfo").setDescription("Get info on the current server")
        .addSubcommand(subcommand => subcommand
            .setName('bans')
            .setDescription('Bans a user from the server')),
    category: 'General',
    execute: async (interaction) => {
        if (interaction.options.getSubcommand() === 'bans') {
            let bans = await interaction.guild.bans.fetch();
            // consola.info("Bans:", bans);
            await interaction.reply({ embeds: [new EmbedBuilder()
                .setColor('Red')
                .setTitle(`Bans on **${interaction.guild.name}**`)
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(`${bans.size > 0 ? bans.map(ban => `<@${ban.user.id}> - ${ban.reason || 'no reason provided'}`).join('\n') : 'No bans'}`)
                .setFooter({ text: `Ban Count: ${bans.size}` })
            ]});
        }
    }
}