import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export const command = {
    data: new SlashCommandBuilder().setName('marin').setDescription('Gives you a random picture of our godess Marin Kitagawa'),
    category: 'Entertainment',
    async execute(interaction) {
        let marinrequest = await fetch('https://api.waifu.im/random/?selected_tags=marin-kitagawa')
        let marin = await marinrequest.json()
        let buttons = new ActionRowBuilder()
        let marincontent = await marin.images[0].url;
        let marinart = await marin.images[0].source;
        let marincolor = await marin.images[0].dominant_color;
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel("Open in Browser")
                .setStyle(ButtonStyle.Link)
                .setURL(marincontent.toString())
        )
        buttons.addComponents(
            new ButtonBuilder()
                .setLabel("Open Artist/Source in Browser")
                .setStyle(ButtonStyle.Link)
                .setURL(marinart.toString())
        )
        let embed = new EmbedBuilder()
            .setColor(marincolor.toString())
            .setTitle("Marin, my beloved.")
            .setURL(marincontent.toString())
            .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
            .setImage(marincontent.toString())
            .setTimestamp()

        await interaction.reply({ content: `marin best girl <3`, embeds: [embed], ephemeral: true, components: [buttons] })
    },
};
