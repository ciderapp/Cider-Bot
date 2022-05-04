const { SlashCommandBuilder} = require('@discordjs/builders');
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName('donate').setDescription('Responds to \"How donate????\"').addUserOption(option => option.setName('user').setDescription('User to repond to')),
    async execute(interaction) {
        let embed = new Discord.MessageEmbed()
            .setTitle("Donate")
            .setDescription(`You can donate via our Open Collective Organization (<@&923351772532199445>) or via Ko-Fi (<@&905457688211783690>, <@&905457957486067843>). Whichever is most convenient for your country/payment method and both are eligible for a <@&932811694751768656> role.\n\n Some of us also have individual donation links, if you would rather support one person.\n\n  **Note: the payment processor might take a percentage of your donation before the rest reaches to us!**`)
            .setTimestamp()
        let user = interaction.options.getUser('user') || null
        let oc = new Discord.MessageButton()
            .setLabel(`OpenCollective`)
            .setStyle('LINK')
            .setURL(`https://opencollective.com/ciderapp`)
        let kofi = new Discord.MessageButton()
            .setLabel(`Ko-fi`)
            .setStyle('LINK')
            .setURL(`https://ko-fi.com/cryptofyre`)
        let ghSponsors = new Discord.MessageButton()
            .setLabel(`Github Sponsors`)
            .setStyle('LINK')
            .setURL(`https://github.com/sponsors/ciderapp`)

        if (user) {
            await interaction.reply({ content: `${user}`, embeds: [embed], components: [new Discord.MessageActionRow().addComponents([oc, kofi, ghSponsors])] })
        } else {
            await interaction.reply({ embeds: [embed], components: [new Discord.MessageActionRow().addComponents([oc, kofi, ghSponsors])] })
        }
               
    },
};