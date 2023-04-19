import { useQueue } from 'discord-player';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Get the bots ping')
        .addBooleanOption(option => option
            .setName('show')
            .setDescription('Show to everyone')
            .setRequired(false)
        ),
    category: 'General',
    async execute(interaction : ChatInputCommandInteraction) {
        let show = interaction.options.getBoolean('show') || false;
        let queue = useQueue(interaction.guild!.id);
        console.log(queue?.connection)
        await interaction.reply({ content: `:heartbeat: | Heartbeat - ${interaction.client.ws.ping}ms\n:ping_pong: | Latency - ${Date.now() - interaction.createdTimestamp}ms\n${queue && queue.isPlaying() ? `:headphones: | Music - ${queue.ping}ms`: ''}`, ephemeral: !show})
    }
}