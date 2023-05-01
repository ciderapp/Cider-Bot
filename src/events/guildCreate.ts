import consola from 'consola';
import { ActivityType, EmbedBuilder, Events, Guild, TextChannel } from 'discord.js'

export default {
    name: Events.GuildCreate,
    once: false,
    execute(guild: Guild) {
        consola.info(`Joined guild ${guild.name} (${guild.id})`);
        const channel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.client.user)?.has('SendMessages')) as TextChannel;
        channel.send({content: '', embeds: [
            new EmbedBuilder()
                .setAuthor({ name: guild.client.user?.username, iconURL: guild.client.user?.avatarURL() as string, url: 'https://discord.com/users/921475709694771252' })
                .setTitle(`Thanks for adding me!, ${guild.name}`)
                .setDescription("I'm Cider, the official companion bot from [Cider Collective](https://discord.gg/applemusic).\n\nSome Useful Commands:\n</play:1100430078665576497> - plays music in your voice channel.\n</branchbuilds:1100430078665576488> - generates the latest build of Cider straight from our labs .\n</artwork:1100430079084990642> - generates a high quality image of the album/artist provided.\n</info:1100430079084990643> - gets the info of the query provided from Apple Music.\n</lyrics:1100430078665576495> - gets the lyrics of the song provided.\n\nIf you need any help for any of my commands, feel free to use </help:1100430079084990644> to provide a quick guide or visiting my Discord Server for more info.")                .setColor(0xf21f52)
                .setThumbnail(guild.iconURL())
                .setTimestamp()
        ]});
        guild.client.user.setActivity(`${guild.client.guilds.cache.size} servers`, { type: ActivityType.Listening });
    }
}