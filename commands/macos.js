const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName('macos').setDescription('Shows available macOS builds (Signed for M1 and Intel Macs)').addBooleanOption(option => option.setName('show').setDescription('Show to everyone!').setRequired(false)),
    async execute(interaction) {
        let buttons = new Discord.MessageActionRow()
        buttons.addComponents(
            new Discord.MessageButton()
                .setLabel(`.dmg (Universal)`)
                .setStyle('LINK')
                .setURL('https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.dmg')
        )
        buttons.addComponents(
            new Discord.MessageButton()
                .setLabel(`.pkg (Universal)`)
                .setStyle('LINK')
                .setURL('https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.pkg')
        )

        if (typeof interaction.options.getBoolean('show') == 'undefined') { show = false } else { show = interaction.options.getBoolean('show') }
        await interaction.reply({ content: `Listing available macOS installation packages.`, ephemeral: !show, components: [buttons] })
    },
};







//
