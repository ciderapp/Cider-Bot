import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Guild, GuildMember, SlashCommandBuilder } from 'discord.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName("skip-to")
        .setDescription("skips to a song in the queue!")
        .addStringOption(option => option.setName("track").setDescription("The position / track you want to skip to!").setAutocomplete(true).setRequired(true)),
    category: 'Music',
    async autocomplete(interaction: AutocompleteInteraction) {
        let query: string | null = interaction.options.getFocused();
        let queue = interaction.client.player.nodes.get(interaction.guildId as string);
        if(!queue) return interaction.respond([]);
        if(!query) return interaction.respond(queue.tracks.map((track, i) => ({ name: i+1 + " - " + track.title, value: String(i+1) })).slice(0, 25));
        if(!isNaN(Number(query)) && queue.tracks.at(Number(query) -1)) return interaction.respond([{ name: queue.tracks.at(Number(query) - 1)!.title, value: String(Number(query) - 1) }]);
        return interaction.respond(queue.tracks.filter(track => track.title.toLowerCase().includes(query!.toLowerCase())).map((track, i) => ({ name: track.title, value: String(i+1) })).slice(0, 25));

        
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!(interaction.member as GuildMember).voice.channelId) return await interaction.reply({ content: "You need to be in a voice channel to use this command!", ephemeral: true });
        if ((interaction.guild as Guild).members.me!.voice.channelId && (interaction.member as GuildMember).voice.channelId !== (interaction.guild as Guild).members.me!.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        let queue = interaction.client.player.nodes.get(interaction.guildId as string);
        if(!queue) return await interaction.reply({ content: "There is no music playing!", ephemeral: true });
        queue.node.skipTo(Number(interaction.options.getString("track")) - 1);
        await interaction.reply({ content: `Skipped **${queue.currentTrack?.title}**`, ephemeral: interaction.isButton() })
    }
}