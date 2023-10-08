export const CiderGET = () => {
    return { 'User-Agent': 'Cider', Referer: 'localhost' };
};
export const CiderPOST = () => {
    return { 'User-Agent': 'Cider', Referer: 'localhost', 'Content-Type': 'application/json' };
};
export const MusicKit = (apiToken) => {
    return {
        Authorization: 'Bearer ' + apiToken,
        DNT: '1',
        authority: 'amp-api.music.apple.com',
        origin: 'https://beta.music.apple.com',
        referrer: 'https://beta.music.apple.com/',
        'sec-fetch-dest': 'empty',
        'sec-fetcher-mode': 'cors',
        'sec-fetch-site': 'same-site'
    };
};
