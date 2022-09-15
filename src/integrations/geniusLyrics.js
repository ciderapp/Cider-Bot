import Genius from 'genius-lyrics';
import 'dotenv/config';
import { EmbedBuilder } from 'discord.js';

const client = new Genius.Client(process.env.geniusKey);

export const getLyrics = async song => {
    const searches = await client.songs.search(song, { sanitizeQuery: true });
    const firstSong = searches[0];
    if (!firstSong) return null;
    console.log("firstsong:",firstSong)
    const lyrics = await firstSong.lyrics();
    // console.log(lyrics)
    if (!lyrics) return null;
    return new EmbedBuilder()
        .setTitle(`${firstSong.fullTitle}`)
        .setDescription(lyrics)
        .setColor(0xf21f52)
        .setThumbnail(`${firstSong.image}`)
        .setURL(`${firstSong.url}`)

}
