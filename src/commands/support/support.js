import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import pack from '../../../package.json' assert { type: 'json'};
export const command = {
    data: new SlashCommandBuilder().setName('support').setDescription("Need support?").addUserOption(option => option.setName('user').setDescription('User to repond to')),
    category: 'Support',
    async execute(interaction) {
        let embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle("Support")
            .setDescription("Need support? Or want to request for data deletion?\nContact us on these platforms:\n\n:envelope_with_arrow: <mailto://cryptofyre@cider.sh>\n[<:github:967957574525804624> Github](https://github.com/orgs/ciderapp/discussions)\n[<:twitter:1024171779289251970> Twitter](https://twitter.com/useCider/)")
            .setFooter({ text: `Bot Version: ${pack.version} ${process.env.NODE_ENV || ""}` })        
        let user = interaction.options.getUser('user') || null
        if (user) {
            await interaction.reply({ content: `${user}`, embeds: [embed]});
        } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
