const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName('discordrpc').setDescription('Responds to \"why discord no work????\"').addUserOption(option => option.setName('user').setDescription('User to repond to')),
    async execute(interaction) {
        let embed = new Discord.MessageEmbed()
            .setTitle("Why is Discord RPC not working?")
            .setURL()
            .setDescription(`Make sure that 'Display current activity as a status message' is enabled in your Activity Status category in the Discord settings. Cider will not appear as a game, so do not manually add it.\n\n If you are using Discord from the Snap Store, you are advised to install from a different source (Discords Website or using another package manager). The Snap Store version of Discord is known to have issues with DiscordRPC. \n\n Ensure that you are running Discord on a level that is below Cider. If Discord is being elevated, Cider will be unable to connect. Furthermore, ensure that Discord is started first. Cider has to connect to Discord and this is only done on Cider's launch. So **make sure Discord is started before Cider.**`)
            .setImage("https://camo.githubusercontent.com/6c8838c5a50fc6f061ead8787e54e4367420bc3169ddbc37e524adb3180a7848/68747470733a2f2f692e696d6775722e636f6d2f337a6e664f4d682e706e67")
            .setTimestamp()
        let user = interaction.options.getUser('user') || null
        if (user) {
            await interaction.reply({ content: `${user}`, embeds: [embed] })
        } else {
            await interaction.reply({ embeds: [embed] })
        }
    },
};