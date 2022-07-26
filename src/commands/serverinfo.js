import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName("serverinfo").setDescription("Get info on the current server")
        .addSubcommand(subcommand => subcommand
            .setName('bans')
            .setDescription('Bans a user from the server')),
    category: 'General',
    execute: async (interaction) => {
        if (interaction.options.getSubcommand() === 'bans') {
            consola.info("Bans:", interaction.guild.bans.cache);
            await interaction.reply({ embeds: [new EmbedBuilder()
                .setTitle(`Bans on **${interaction.guild.name}**`)
                .setDescription(`${interaction.guild.bans.cache.length > 0 ? interaction.guild.bans.cache.map(ban => `${ban.user.tag} - ${ban.reason}`).join('\n') : 'No bans'}`)
            ]});
        }
    }
}