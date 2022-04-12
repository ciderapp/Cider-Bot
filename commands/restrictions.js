const { SlashCommandBuilder} = require('@discordjs/builders');
const Discord = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder().setName('restrictions').setDescription('Responds to \"Why is my Cider skipping songs\"').addUserOption(option => option.setName('user').setDescription('User to repond to')),
    async execute(interaction) {
        let embed = new Discord.MessageEmbed()
            .setTitle("Why is Cider skipping some songs?")
            .setDescription("Your account might have content restartictions set to \"Clean\"\n\n In order to check, go to https://tv.apple.com/settings and check the \"Content Restrictions\" section.\n\n Make sure that Music is set to \`Explicit\`")
            .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
            .setTimestamp()
        let user = interaction.options.getUser('user') || null
        let settings = new Discord.MessageButton()
            .setLabel(`Apple TV Settings (yes, its tv)`)
            .setStyle('LINK')
            .setURL(`https://tv.apple.com/settings`)
        if (user) {
            await interaction.reply({ content: `${user}`, embeds: [embed], components: [new Discord.MessageActionRow().addComponents([settings])] })
        } else {
            await interaction.reply({ embeds: [embed], components: [new Discord.MessageActionRow().addComponents([settings])] })
        }
        
    },
};