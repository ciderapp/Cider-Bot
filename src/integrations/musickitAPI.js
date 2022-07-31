import 'dotenv/config'

export const getAPIToken = async () => {
    let apiToken = await fetch("https://api.cider.sh/v1", { headers: { process.env.API_HEADER_KEY: process.env.API_HEADER_VALUE } });
    apiToken = await apiToken.json()
    return apiToken.token;
}