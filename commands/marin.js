const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require("node-fetch");
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName('marin').setDescription('Gives you a random picture of our godess Marin Kitagawa'),
    async execute(interaction) {
        let marinrequest = await fetch('https://api.waifu.im/random/?selected_tags=marin-kitagawa')
        let marin = await marinrequest.json()
        let buttons = new Discord.MessageActionRow()
        let marincontent = await marin.images[0].url;
        let marinart = await marin.images[0].source;
        let marincolor = await marin.images[0].dominant_color;
        buttons.addComponents(
            new Discord.MessageButton()
                .setLabel("Open in Browser")
                .setStyle('LINK')
                .setURL(marincontent.toString())
        )
        buttons.addComponents(
            new Discord.MessageButton()
                .setLabel("Open Artist/Source in Browser")
                .setStyle('LINK')
                .setURL(marinart.toString())
        )
        let embed = new Discord.MessageEmbed()
            .setColor(marincolor.toString())
            .setTitle("Marin, my beloved.")
            .setURL(marincontent.toString())
            .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
            .setImage(marincontent.toString())
            .setTimestamp()

        await interaction.reply({ content: `marin best girl <3`, embeds: [embed], ephemeral: true, components: [buttons] })
    },
};
