import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName("serverinfo").setDescription("Get info on the current server")
        .addSubcommand(subcommand => subcommand
            .setName('bans')
            .setDescription('Bans a user from the server')),
    category: 'General',
    execute: async (interaction) => {
        if (interaction.options.getSubcommand() === 'bans') {
            let bans = await interaction.guild.fetch();
            bans = bans.bans;
            consola.info("Bans:", bans);
            await interaction.reply({ embeds: [new EmbedBuilder()
                .setTitle(`Bans on **${interaction.guild.name}**`)
                .setDescription(`${bans.length > 0 ? bans.map(ban => `${ban.user.tag} - ${ban.reason}`).join('\n') : 'No bans'}`)
            ]});
        }
    }
}