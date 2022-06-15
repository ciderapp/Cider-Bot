import { SlashCommandBuilder } from '@discordjs/builders';
import { ActionRowBuilder, ButtonBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName('macos').setDescription('Shows available macOS builds (Signed for M1 and Intel Macs)').addBooleanOption(option => option.setName('show').setDescription('Show to everyone!').setRequired(false)),
    async execute(interaction) {
        let buttons = new ActionRowBuilder()
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel(`.dmg (Universal)`)
                .setStyle('LINK')
                .setURL('https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.dmg')
        )
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel(`.pkg (Universal)`)
                .setStyle('LINK')
                .setURL('https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.pkg')
        )

        if (typeof interaction.options.getBoolean('show') == 'undefined') { show = false } else { show = interaction.options.getBoolean('show') }
        await interaction.reply({ content: `Listing available macOS installation packages.`, ephemeral: !show, components: [buttons] })
    },
};







//
