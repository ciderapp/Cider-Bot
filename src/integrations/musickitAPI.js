import fetch from 'node-fetch';
import { Cider as CiderHeader , MusicKit as MusicKitHeader} from '../data/headers.js';
import 'dotenv/config';

export const getAPIToken = async () => {
    let apiToken = await fetch("https://api.cider.sh/v1", { headers: CiderHeader() });
    return (await apiToken.json()).token;
};

export const getArtwork = async (apiToken, query, animatedArtwork) => {
    if (query.startsWith('https://music.apple.com/')) {
        query = (await convertLinkToAPI(query)).url;
    }
    let href = `https://amp-api.music.apple.com${query}`;
    if(animatedArtwork && href.includes('?')) href = href + "&extend=editorialVideo";
    else if(animatedArtwork) href = href + "?extend=editorialVideo,editorialArtwork";
    console.log(href);

    let res = await fetch(href, { headers: MusicKitHeader(apiToken) });
    res = await res.json();
    consola.info(res);
    if(res.results) { res = res.results.topResults }
    consola.info(res.data[0].attributes);
    return res.data[0];
};

const convertLinkToAPI = async (link) => {
    let catalog = link.split('/')[3];
    let kind = link.split('/')[4];
    let albumId = link.split('/')[6];
    let songId = link.split('=')[1];
    if (kind === 'album') {
        if (songId) {
            return { url: `/v1/catalog/${catalog}/songs/${songId}`, kind: 'song' }
        }
        return { url: `/v1/catalog/${catalog}/albums/${albumId}`, kind: 'album' };
    }
    else if (kind === 'playlist') {
        return { url: `/v1/catalog/${catalog}/playlists/${albumId}`, kind: 'playlist' };
    }
    else if(kind === 'artist') {
        return { url: `/v1/catalog/${catalog}/artists/${albumId}`, kind: 'artist' };
    }
}