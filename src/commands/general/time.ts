import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
//@ts-ignore
import { firebase } from '../../integrations/firebase.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription("Displays user's local time")
        .addUserOption((option) => option.setName('user').setDescription('Mention user')),
    category: 'General',
    async execute(interaction: ChatInputCommandInteraction) {
        let user = interaction.options.getUser('user') || interaction.user;

        let timezone = await firebase.getUserTimezone(user.id);
        if (!timezone)
            return user.id == interaction.user.id
                ? await interaction.reply({ content: 'You have not set your timezone yet. Use </settimezone:1039954860944134185> to set your timezone.', ephemeral: true })
                : await interaction.reply({ content: `${user.tag} has not set their timezone yet.`, ephemeral: true });
        let formatter = new Intl.DateTimeFormat([], { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
        await interaction.reply({ content: `The current time for **${user.tag}**'s is: ${formatter.format(new Date())}` });
    }
};
