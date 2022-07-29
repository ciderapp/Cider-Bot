export const getAPIToken = async () => {
    let apiToken = await fetch("https://api.cider.sh/v1", { headers: { "User-Agent": "Cider" } });
    apiToken = await apiToken.json()
    return apiToken.token;
}