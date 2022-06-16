import { SlashCommandBuilder } from '@discordjs/builders';
import fetch from 'node-fetch';
import { ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName('sauceme').setDescription('Gives you a random extra saucy image (18+)'),
    async execute(interaction) {
        let saucerequest = await fetch('https://api.waifu.im/random/?selected_tags=hentai')
        let sauce = await saucerequest.json()
        let buttons = new ActionRowBuilder()
        let saucecontent = await sauce.images[0].url;
        let sauceart = await sauce.images[0].source;
        let saucecolor = await sauce.images[0].dominant_color;
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel("Open in Browser")
                .setStyle(ButtonStyle.Link)
                .setURL(saucecontent.toString())
        )
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel("Open Artist/Source in Browser")
                .setStyle(ButtonStyle.Link)
                .setURL(sauceart.toString())
        )
        let embed = new EmbedBuilder()
            .setColor(saucecolor.toString())
            .setTitle("Sauce Randomizer")
            .setURL(saucecontent.toString())
            .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
            .setImage(saucecontent.toString())
            .setTimestamp()

        await interaction.reply({ content: `feeling down bad are we?`, embeds: [embed], ephemeral: true, components: [buttons] })
    },
};
