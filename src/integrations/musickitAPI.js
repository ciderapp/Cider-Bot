import 'dotenv/config'

export const getAPIToken = async () => {
    let key = process.env.API_HEADER_KEY
    let apiToken = await fetch("https://api.cider.sh/v1", { headers: { "User-Agent": process.env.API_HEADER_VALUE } });
    apiToken = await apiToken.json()
    return apiToken.token;
}