import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Invite Cider to your server!"),
    category: 'General',
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({ components: [ //@ts-ignore
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Invite Me')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://canary.discord.com/api/oauth2/authorize?client_id=921475709694771252&permissions=1359660576246&scope=applications.commands%20bot')
                )
        ]})
    }
}