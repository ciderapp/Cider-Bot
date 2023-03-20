import { ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, Guild, GuildMember, SlashCommandBuilder } from 'discord.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Shows the current queue!"),
    category: 'Music',
    async execute(interaction: ChatInputCommandInteraction | ButtonInteraction) {
        if (!(interaction.member as GuildMember).voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if ((interaction.guild as Guild).members.me!.voice.channelId && (interaction.member as GuildMember).voice.channelId !== (interaction.guild as Guild).members.me!.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        let queue = interaction.client.player.nodes.get(interaction.guildId as string);
        let upnext = queue!.size > 10 ? queue?.tracks.filter((track, index) => index >= 0 && index <= 10).map((track, index) => `${index + 1}. ${track.author} - ${track.title}`).join("\n") + "\n...\n + \`" + (queue?.tracks.size! - 10) + " more tracks\`" : queue?.tracks.map((track, index) => `${index + 1}. ${track.author} - ${track.title}`).join("\n");
        if(!queue) return await interaction.reply({ content: "There is no music playing!", ephemeral: true });
        let queueEmbed = new EmbedBuilder()
            .setTitle(`Queue for ${interaction.guild?.name}`)
            .setColor(0xf21f52)
            .setThumbnail(interaction.guild?.iconURL() as string)
            .addFields(
                { name: 'Current Track', value: `${queue.currentTrack?.author} - ${queue.currentTrack?.title}` },
                { name: 'Up Next', value:  upnext ? upnext : "No tracks in queue" }
            )

        await interaction.reply({ embeds: [queueEmbed] })
    }
}