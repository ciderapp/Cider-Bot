import Genius from 'genius-lyrics';
import { geniusKey } from '../local.js';
import { EmbedBuilder } from 'discord.js';

const client = new Genius.Client(geniusKey);

export const getLyrics = async song => {
    const searches = await client.songs.search(song);
    const firstSong = searches[0];
    if (!firstSong) return null;
    console.log(firstSong)
    const lyrics = await firstSong.lyrics();
    console.log(lyrics)
    if (!lyrics) return null; 
    return new EmbedBuilder() 
        .setTitle(`${firstSong.fullTitle}`)
        .setDescription(lyrics)
        .setColor(0xf21f52) 
        .setThumbnail(`${firstSong.image}`) 
        .setURL(`${firstSong.url}`)
    
}
