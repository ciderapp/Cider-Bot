const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('after-dark')
        .setDescription('Gives an invite to the Cider After Dark Discord server')
        .addBooleanOption(option => option.setName('show')
            .setDescription('Show invite to everyone!')
            .setRequired(false)
        ),
    async execute(interaction) {
        let show = interaction.options.getBoolean('show') || true
        await interaction.reply({ content: `:detective: Join the Cider: After Dark Server! \nhttps://discord.gg/fNXzTB9FtW`, ephemeral: !show });
        
    }
}