import { CiderGET as CiderHeader, MusicKit as MusicKitHeader } from '../data/headers.js';
import 'dotenv/config';

export const getAPIToken = async () => {
    let apiToken = await fetch('https://api.cider.sh/v1', { headers: CiderHeader() });
    return (await apiToken.json()).token;
};

export const getArtwork = async (apiToken: string, query: string, animatedArtwork: boolean) => {
    // console.info(`[MusicKit] Fetching artwork for ${query}`);
    if (query.startsWith('https://music.apple.com') || query.startsWith('https://beta.music.apple.com')) query = (await convertLinkToAPI(query)) as string;
    let href = `https://amp-api.music.apple.com${query}`;
    if (animatedArtwork && href.includes('?')) href = href + '&extend=editorialVideo&include=albums';
    else if (animatedArtwork) href = href + '?extend=editorialVideo&include=albums';
    let res = await (await fetch(href, { headers: MusicKitHeader(apiToken) })).json();
    if (res.results) {
        res = res.results.top;
        if (res.data[0].type === 'songs') {
            res = await fetch(`https://amp-api.music.apple.com${res.data[0].href}?extend=editorialVideo&include=albums`, { headers: MusicKitHeader(apiToken) });
            res = await res.json();
        }
    }
    if (animatedArtwork && res.data[0].type === 'songs') res.data[0].attributes.editorialVideo = res.data[0].relationships.albums.data[0].attributes?.editorialVideo;
    return res.data[0];
};

export const getInfo = async (apiToken: string, query: string) => {
    if (query.startsWith('https://music.apple.com/') || query.startsWith('https://beta.music.apple.com/')) query = (await convertLinkToAPI(query)) as string;
    let href = `https://amp-api.music.apple.com${query}`;
    let res = await (await fetch(href, { headers: MusicKitHeader(apiToken) })).json();
    if (res.results) res = res.results.top;
    return res.data[0];
};

export const search = async (apiToken: string, query: string, storefront: string = 'us', limit: number = 10) => {
    let href = new URL(`v1/catalog/${storefront}/search/`, 'https://amp-api.music.apple.com/');
    href.searchParams.set('term', query);
    href.searchParams.set('platform', 'web');
    href.searchParams.set('types', 'albums,playlists,songs');
    href.searchParams.set('limit', `${limit}`);
    href.searchParams.set('with', 'serverBubbles,lyricHighlights');
    href.searchParams.set('omit[resource]', 'autos');
    
    let res = await (await fetch(href.toString(), { headers: MusicKitHeader(apiToken) })).json();
    return res.results.top.data;
    
};

const convertLinkToAPI = async (link: string) => {
    let catalog = link.split('/')[3];
    let kind = link.split('/')[4];
    let name = link.split('/')[5];
    let albumId = link.split('/')[6];
    let songId = link.split('=')[1];
    if (kind === 'album') {
        if (songId) {
            return `/v1/catalog/${catalog}/songs/${songId}`;
        }
        return `/v1/catalog/${catalog}/albums/${albumId}`;
    } else if (kind === 'playlist') {
        return `/v1/catalog/${catalog}/playlists/${albumId}`;
    } else if (kind === 'artist') {
        return `/v1/catalog/${catalog}/artists/${albumId}`;
    } else if (kind === 'curator') {
        if (name.startsWith('apple-music-')) return `/v1/catalog/${catalog}/apple-curators/${albumId}`;
        return `/v1/catalog/${catalog}/curators/${albumId}`;
    } else if (kind === 'music-video') {
        return `/v1/catalog/${catalog}/music-videos/${albumId}`;
    }
};
