import {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName('support').setDescription("Need support?").addUserOption(option => option.setName('user').setDescription('User to repond to')),
    category: 'Support',
    async execute(interaction) {
        let embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle("Support")
            .setDescription("Need support? Or want to request for data deletion? Create a post in the <#996168362826674246> channel or contact us on given platforms.");
        let components = [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Support Channel').setStyle(ButtonStyle.Link).setURL('https://discord.com/channels/843954443845238864/996168362826674246'), // Discussion Channel Link
            new ButtonBuilder().setLabel('Ticket Support').setStyle(ButtonStyle.Link).setURL('https://discord.com/channels/843954443845238864/872561715110367302'), // Ticket Channel Link
            new ButtonBuilder().setLabel('Mail').setStyle(ButtonStyle.Link).setURL('mailto:cryptofyre@cider.sh'),
            new ButtonBuilder().setLabel('GitHub').setStyle(ButtonStyle.Link).setURL('https://github.com/orgs/ciderapp/discussions'),
            new ButtonBuilder().setLabel('Twitter').setStyle(ButtonStyle.Link).setURL('twitter.com/useCider/'),
        )];
        let user = interaction.options.getUser('user') || null
        if (user) {
            await interaction.reply({ content: `${user}`, embeds: [embed], components: [components] });
        } else {
            await interaction.reply({ embeds: [embed], components: [components], ephemeral: true });
        }
    },
};
