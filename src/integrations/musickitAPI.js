import fetch from 'node-fetch';
import 'dotenv/config';
export const getAPIToken = async () => {
    let apiToken = await fetch("https://api.cider.sh/v1", { headers: { "User-Agent": process.env.USER_AGENT }});
    return (await apiToken.json()).token;
};