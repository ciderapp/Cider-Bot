import { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Invite Cider to your server!"),
    category: 'General',
    execute: async (interaction) => {
        let reply = await interaction.reply({ components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Invite Me')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://canary.discord.com/api/oauth2/authorize?client_id=921475709694771252&permissions=1359660576246&scope=applications.commands%20bot')
                )
        ]})
    }
};
