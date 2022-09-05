import fetch from 'node-fetch';
import { CiderGET as CiderHeader, MusicKit as MusicKitHeader } from '../data/headers.js';
import 'dotenv/config';

export const getAPIToken = async () => {
    let apiToken = await fetch("https://api.cider.sh/v1", { headers: CiderHeader() });
    return (await apiToken.json()).token;
};

export const getArtwork = async (apiToken, query, animatedArtwork, storefront) => {
    if (query.startsWith('https://music.apple.com/')) {
        query = convertLinkToAPI(query, storefront).url;
    }
    let href = `https://amp-api.music.apple.com${query}`;
    if (animatedArtwork && href.includes('?')) href = href + "&extend=editorialVideo&include=albums";
    else if (animatedArtwork) href = href + "?extend=editorialVideo&include=albums";
    let res = await fetch(href, { headers: MusicKitHeader(apiToken) });
    res = await res.json();
    if (res.results) {
        res = res.results.topResults
        if (res.data[0].type === "songs") {
            res = await fetch(`https://amp-api.music.apple.com${res.data[0].href}?extend=editorialVideo&include=albums`, { headers: MusicKitHeader(apiToken) });
            res = await res.json();
        }
    }
    if (animatedArtwork && res.data[0].type === "songs") res.data[0].attributes.editorialVideo = res.data[0].relationships.albums.data[0].attributes?.editorialVideo;
    return res.data[0];
};

export const getInfo = async (apiToken, query, storefront) => {
    if (query.startsWith('https://music.apple.com/')) query = convertLinkToAPI(query, storefront).url;
    let href = `https://amp-api.music.apple.com${query}`;
    let res = await fetch(href, { headers: MusicKitHeader(apiToken) });
    res = await res.json();
    if (res.results) res = res.results.topResults;
    return res.data[0];
}

const convertLinkToAPI = (link, storefront) => {
    let catalog = storefront || link.split('/')[3];
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
    else if (kind === 'artist') {
        return { url: `/v1/catalog/${catalog}/artists/${albumId}`, kind: 'artist' };
    }
}