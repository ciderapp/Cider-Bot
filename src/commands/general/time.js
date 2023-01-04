import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { firebase } from '../../integrations/firebase.js';

export const command = {
    data: new SlashCommandBuilder().setName('time').setDescription("Displays user's local time").addUserOption(option => option.setName('user').setDescription('Mention user')),
    category: 'General',
    async execute(interaction) {
        let user = interaction.options.getUser('user') || interaction.user;

        await firebase.getUserTimezone(user.id).then(async (timezone) => {
            if (!timezone) {
                (user.id == interaction.user.id) ? await interaction.reply({ content: 'You have not set your timezone yet. Use `/settimezone` to set your timezone.', ephemeral: true }) : await interaction.reply({ content: `${user.tag} has not set their timezone yet.`, ephemeral: true });
            } else {
                let options = {
                    timeZone: timezone,
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                },
                    formatter = new Intl.DateTimeFormat([], options);
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Blurple')
                            .setDescription(`The current time for **${user.tag}**'s is: ${formatter.format(new Date())}`)                    ]
                })
            }
        })
    },
};