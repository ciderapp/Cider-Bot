import { ButtonInteraction, ChatInputCommandInteraction, Guild, GuildMember, SlashCommandBuilder } from 'discord.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("shuffles the queue!"),
    category: 'Music',
    async execute(interaction: ChatInputCommandInteraction | ButtonInteraction) {
        if (!(interaction.member as GuildMember).voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if ((interaction.guild as Guild).members.me!.voice.channelId && (interaction.member as GuildMember).voice.channelId !== (interaction.guild as Guild).members.me!.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        let queue = interaction.client.player.nodes.get(interaction.guildId as string);
        if(!queue) return await interaction.reply({ content: "There is no music playing!", ephemeral: true });
        if(queue.tracks.size < 2) return await interaction.reply({ content: "There are not enough songs in the queue to shuffle!", ephemeral: true });
        queue.tracks.shuffle();
        await interaction.reply({ content: `Shuffled \`${queue.tracks.size}\` songs`, ephemeral: interaction.isButton() })
    }
}