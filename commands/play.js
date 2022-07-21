import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
export const command = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song!")
        .addStringOption(option => option.setName("query")
            .setDescription("The song to play!")
            .setRequired(true)
        ),
    category: 'Music',
    execute: async (interaction) => {
        let { client } = await import('../index.js');
        const musicordPlayer = client.musicordPlayer;
        const SongSearcher = client.SongSearcher;
        let msgArgs = interaction.options.get('query').value;
        if(!msgArgs.startsWith('https://')) {
            const searchedSongs = await SongSearcher.search(msgArgs, { maxResults: 10 });
            msgArgs = searchedSongs[0].url;
        }
        else if (msgArgs.startsWith('https://music.apple.com/')) {
            let catalog = msgArgs.split('/')[3];
            let songId = msgArgs.split('=')[1];
            let targetURL = `https://api.music.apple.com/v1/catalog/${catalog}/songs/${songId}`;
            let apiToken = await fetch("https://api.cider.sh/v1", {headers: { "User-Agent": "Cider" }});
            apiToken = await apiToken.json();
            let appleMusic = await fetch(targetURL, {headers: { "Authorization": "Bearer " + apiToken.token }});
            appleMusic = await appleMusic.json()
            let song = appleMusic.data[0].attributes;
            msgArgs = `${song.artistName} - ${song.name} in ${song.albumName} (Audio)`;
            const searchedSongs = await SongSearcher.search(msgArgs, { maxResults: 10 });
            msgArgs = searchedSongs[0].url;
        }
        console.log(msgArgs);

        if (!msgArgs) return interaction.reply('Argument required');
        const msgMember = interaction.guild.members.cache.get(interaction.member.user.id);
        if (msgMember && msgMember.voice.channel) {
            if (musicordPlayer.existQueue(interaction.guild)) {
                const queue = musicordPlayer.getQueue(interaction.guild);
                if (queue) await queue.play(msgArgs, msgMember.voice.channel);
                const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
                if (queueInfo && queue) interaction.reply(`${queueInfo.songs[1].title} has been added to the queue`)
            } else {
                const queue = musicordPlayer.initQueue(interaction.guild, {
                    textChannel: interaction.channel,
                    voiceChannel: msgMember.voice.channel
                });
                if (queue) {
                    interaction.deferReply();
                    // queue.setFilter(AudioFilters.customEqualizer({
                    //    band1: 99, // 20
                    //    band2: 45, // 50
                    //    band3: 54, // 94.82
                    //    band4: 53, // 200
                    //    band5: 52, // 500
                    //    band6: 51, // 1000
                    //    band7: 50, // 2000
                    //    band8: 49, // 5000
                    //    band9: 48, // 10000
                    //    band10: 47, // 20000
                    // }));
                    await queue.play(msgArgs, msgMember.voice.channel)
                }
                const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
                if (queueInfo) return await interaction.editReply(`Playing ${queueInfo.songs[0].title}`)
            }
        }
    }
}