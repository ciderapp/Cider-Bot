import { ButtonInteraction, ChatInputCommandInteraction, Guild, GuildMember, SlashCommandBuilder } from 'discord.js';
import { nowPlayingComponents, nowPlayingEmbed } from '../../integrations/discord-player.js';
import { QueueRepeatMode, Track } from 'discord-player';
import consola from 'consola';
export const command = {
    data: new SlashCommandBuilder()
        .setName("autoplay")
        .setDescription("toggle autoplay on or off!"),
    category: 'Music',
    async execute(interaction: ChatInputCommandInteraction | ButtonInteraction) {
        if (!(interaction.member as GuildMember).voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if ((interaction.guild as Guild).members.me!.voice.channelId && (interaction.member as GuildMember).voice.channelId !== (interaction.guild as Guild).members.me!.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        let queue = interaction.client.player.nodes.get(interaction.guildId as string);
        if(!queue) return await interaction.reply({ content: "There is no music playing!", ephemeral: true });
        consola.info(queue.repeatMode)
        if(queue.repeatMode == QueueRepeatMode.AUTOPLAY) {
            queue.setRepeatMode(QueueRepeatMode.OFF);
            await interaction.reply({ content: `Autoplay is now off!`, ephemeral: interaction.isButton() })
        }
        else {
            queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
            await interaction.reply({ content: `Autoplay is now on!`, ephemeral: interaction.isButton() })
        }
    }
}