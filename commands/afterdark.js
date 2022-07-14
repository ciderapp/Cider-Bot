import { SlashCommandBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('after-dark')
        .setDescription('Gives an invite to the Cider After Dark Discord server'),
    async execute(interaction) {
        await interaction.reply({ content: `:detective: Join the Cider: After Dark Server! \nhttps://discord.gg/SKkQ6AAADh`, ephemeral: true });

    }
}
