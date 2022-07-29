import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { default as pm } from 'pretty-ms';
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
        let { client } = await import('../../index.js');
        const musicordPlayer = client.musicordPlayer;
        const SongSearcher = client.SongSearcher;
        let msgArgs = interaction.options.get('query').value;
        const msgMember = interaction.guild.members.cache.get(interaction.member.user.id);
        if (msgMember && msgMember.voice.channel) {
            if (!msgArgs) return interaction.reply('Argument required');
            if (!msgArgs.startsWith('https://')) {
                await interaction.reply(`Searching for ${msgArgs}`);
                const searchedSongs = await SongSearcher.search(msgArgs, { maxResults: 10 });
                msgArgs = searchedSongs[0].url;
                await addToQueue(interaction, musicordPlayer, msgMember, msgArgs);
            }
            else if (msgArgs.startsWith('https://music.apple.com/') || msgArgs.startsWith('https://beta.music.apple.com/')) {
                let target = convertLinkToAPI(msgArgs);
                let apiToken = await fetch("https://api.cider.sh/v1", { headers: { "User-Agent": "Cider" } });
                apiToken = await apiToken.json();
                let appleMusic = await fetch(target.url, { headers: { "Authorization": "Bearer " + apiToken.token } });
                appleMusic = await appleMusic.json();

                if (target.kind === 'album' || target.kind === 'playlist') {
                    await interaction.reply(`Added *${appleMusic.data.length}* tracks to the queue`)
                    for (let track of appleMusic.data) {
                        const searchedSongs = await SongSearcher.search(`${track.attributes.name} by ${track.attributes.artistName} (Audio)`, { maxResults: 10 });
                        track = searchedSongs[0].url;
                        lawait addToQueue(interaction, musicordPlayer, msgMember, track);
                    }
                }
                else if (target.kind === 'song') {
                    await interaction.reply(`Parsing song from Apple Music...`)
                    const track = appleMusic.data[0];
                    const searchedSongs = await SongSearcher.search(`${track.attributes.name} by ${track.attributes.artistName} (Audio)`, { maxResults: 10 });
                    msgArgs = searchedSongs[0].url;
                    await addToQueue(interaction, musicordPlayer, msgMember, msgArgs);
                    await interaction.editReply(`Added **${track.attributes.name}** by ${track.attributes.artistName} to the queue`);
                }
            }
            else if (msgArgs.startsWith('https://www.youtube.com/')) {
                await interaction.reply(`Getting song data from YouTube...`);
                let song = await addToQueue(interaction, musicordPlayer, msgMember, msgArgs);
                await interaction.reply(`Added **${song.title}** to the queue`);
            }
            else {
                await interaction.reply('Sorry, I can only play links from Apple Music and YouTube for now');
            }
        }
        else {
            interaction.reply({content: `You need to be in a voice channel to use this command!`, ephemeral: true});
        }
    }
}

const convertLinkToAPI = (link) => {
    let catalog = link.split('/')[3];
    let kind = link.split('/')[4];
    let albumId = link.split('/')[6];
    let songId = link.split('=')[1];
    if (kind === 'album') {
        if (songId) {
            return { url: `https://api.music.apple.com/v1/catalog/${catalog}/songs/${songId}`, kind: 'song' }
        }
        return { url: `https://api.music.apple.com/v1/catalog/${catalog}/albums/${albumId}/tracks`, kind: 'album' };
    }
    else if (kind === 'playlist') {
        return { url: `https://api.music.apple.com/v1/catalog/${catalog}/playlists/${albumId}/tracks`, kind: 'playlist' };
    }
}

const addToQueue = async (interaction, musicordPlayer, msgMember, song) => {
    let npInterval, npEmbed;
    if (musicordPlayer.existQueue(interaction.guild)) {
        const queue = musicordPlayer.getQueue(interaction.guild);
        if (queue) queue.play(song, msgMember.voice.channel);
        return song;
        
    } else {
        const queue = musicordPlayer.initQueue(interaction.guild, {
            textChannel: interaction.channel,
            voiceChannel: msgMember.voice.channel
        });
        const queueInfo = musicordPlayer.getQueueInfo(interaction.guild);
        queue.on('trackStart', async (channel, song) => {
            // consola.info("Now Playing", song)
            let slidebar = queue.generateSongSlideBar();
            npEmbed = await channel.send({ 
                content: `Playing **${song.title}** @ ${queueInfo.voiceChannel.bitrate / 1000}kbps`,
                embeds: [new EmbedBuilder()
                    .setTitle(`${song.title}`)
                    .setAuthor({
                        name: `${interaction.client.user.username} | Now Playing`,
                        iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
                    })
                    .setDescription(`${pm(queueInfo.ressource.playbackDuration, { colonNotation: true }).split('.')[0]} ${slidebar} ${song.duration}`)
                    .setColor(0xf21f52)
                    .setThumbnail(`https://i.ytimg.com/vi/${song.id}/maxresdefault.jpg`)
                    .setURL(`${song.url}`)
                    .setFooter({ text: queueInfo.songs[1] != null ? `Next Track: ${queueInfo.songs[1].title}` : 'No more tracks in queue' })
                ]
            });
           
            npInterval = setInterval(async () => {
                slidebar = queue.generateSongSlideBar();
                await npEmbed.edit({
                    content: `Playing **${song.title}** @ ${queueInfo.voiceChannel.bitrate / 1000}kbps`,
                    embeds: [new EmbedBuilder()
                        .setTitle(`${song.title}`)
                        .setAuthor({
                            name: `${interaction.client.user.username} | Now Playing`,
                            iconURL: 'https://cdn.discordapp.com/attachments/912441248298696775/935348933213970442/Cider-Logo.png?width=671&height=671',
                        })
                        .setDescription(`${pm(queueInfo.ressource.playbackDuration, { colonNotation: true }).split('.')[0]} ${slidebar} ${song.duration}`)
                        .setColor(0xf21f52)
                        .setThumbnail(`https://i.ytimg.com/vi/${song.id}/maxresdefault.jpg`)
                        .setURL(`${song.url}`)
                        .setFooter({ text: queueInfo.songs[1] != null ? `Next Track: ${queueInfo.songs[1].title}` : 'No more tracks in queue' })
                    ]
                })
            }, 5000);
        })
        queue.on('trackFinished', async (guild, song) => {
            clearInterval(npInterval);
            await npEmbed.delete();
        })
        queue.on('stop', async (guild, song) => {
            consola.info(`The queue in ${guild} has stopped, Leaving Voice Chat`);
            clearInterval(npInterval);
            await npEmbed.delete();
        })
        queue.on('pause', async (guild) => {
            consola.info(`The queue in ${guild} has been paused`);
        })
        if (queue) {
            // interaction.deferReply();
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
            await queue.play(song, msgMember.voice.channel)
        }
        if (queueInfo) return await interaction.deleteReply();
    }
}