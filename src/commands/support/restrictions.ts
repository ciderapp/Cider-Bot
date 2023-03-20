import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('restrictions')
        .setDescription('Responds to "Why is my Cider skipping songs"')
        .addUserOption((option) => option.setName('user').setDescription('User to repond to')),
    category: 'Support',
    async execute(interaction: ChatInputCommandInteraction) {
        let embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Why is Cider skipping some songs?')
            .setDescription(
                'Your account might have content restrictions set to "Clean"\n\n In order to check, go to [Apple Media Account settings](https://tv.apple.com/settings) and check the "Content Restrictions" section.\n\n Make sure that Music is set to `Explicit`'
            )
            .setFooter({ text: 'Requested by ' + (interaction.member as GuildMember).user.username, iconURL: (interaction.member as GuildMember).user.avatarURL() as string })
            .setTimestamp();
        let user = interaction.options.getUser('user') || null;
        if (user) {
            await interaction.reply({ content: `${user}`, embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }
};
