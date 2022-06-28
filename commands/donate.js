import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName('donate').setDescription('Responds to \"How donate????\"').addUserOption(option => option.setName('user').setDescription('User to repond to')),
    category: 'Donation',
    async execute(interaction) {
        let embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle("Donate")
            .setDescription(`You can donate via our Open Collective Organization (<@&923351772532199445>) or via Ko-Fi (<@&905457688211783690>, <@&905457957486067843>). Whichever is most convenient for your country/payment method and both are eligible for a <@&932811694751768656> role.\n\n Some of us also have individual donation links, if you would rather support one person.\n\n  **Note: the payment processor might take a percentage of your donation before the rest reaches to us!**`)
            .setTimestamp()
        let user = interaction.options.getUser('user') || null
        let oc = new ButtonBuilder()
            .setLabel(`OpenCollective`)
            .setStyle(ButtonStyle.Link)
            .setURL(`https://opencollective.com/ciderapp`)
        let kofi = new ButtonBuilder()
            .setLabel(`Ko-fi`)
            .setStyle(ButtonStyle.Link)
            .setURL(`https://ko-fi.com/cryptofyre`)
        let ghSponsors = new ButtonBuilder()
            .setLabel(`Github Sponsors`)
            .setStyle(ButtonStyle.Link)
            .setURL(`https://github.com/sponsors/ciderapp`)

        if (user) {
            await interaction.reply({ content: `${user}`, embeds: [embed], components: [new ActionRowBuilder().addComponents([oc, kofi, ghSponsors])] })
        } else {
            await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents([oc, kofi, ghSponsors])] })
        }

    },
};
