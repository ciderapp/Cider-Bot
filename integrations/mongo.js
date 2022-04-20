const { MongoClient } = require('mongodb');
const mongo = new MongoClient(require('../local').mongo());
const fetch = require('node-fetch')
module.exports = {
    async init() {
        await mongo.connect()
        console.log('[mongo] Connected!')
    },
    async addDonation(user) {
        let userEntry = mongo.db('bot').collection('donations').find({ _id: `${user.id}` })
        userEntry = await userEntry.toArray()

        if (userEntry.length == 0) {
            mongo.db('bot').collection('donations').insertOne({
                _id: user.id,
                transactionID: user.transactionID,
                connectedAt: Date.now(),
            })
        }
        return
    },
    async commandCounter(command) {
        mongo.db('bot').collection('analytics').updateOne({ _id: `${command}` }, { $set: { lastUsed: Date.now() }, $inc: { count: 1 } }, { upsert: true })
    },
    async replyCounter(reply) {
        mongo.db('bot').collection('analytics').updateOne({ _id: `reply-${reply}` }, { $set: { lastUsed: Date.now() }, $inc: { count: 1 } }, { upsert: true })
    },
    async logRPMetadata(listenerData) {
        mongo.db('bot').collection('rp-data').updateOne({ _id: `${listenerData.songName} - ${listenerData.artistName}` }, { $set: { lastListened: Date.now() }, $inc: { count: 1 }, $addToSet: { listeners: listenerData.userid } }, { upsert: true })
    },
    async syncLatestReleases(branch) {
        console.log(`[mongo] Syncing latest releases for ${branch}`)
            let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases?per_page=100`)
            releases = await releases.json()
            for (release in releases) {
                if (String(release.name).split(' ')[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') === branch) {
                    console.log(mongo.db('bot').collection('releases').updateOne({ _id: `${branch}` }, {
                        $set: {
                            tag: `${release.tag_name}`,
                            lastUpdated: `${release.published_at}`,
                            releaseID: `${release.id}`,
                            links: {
                                AppImage: `${release.assets[1].browser_download_url}`,
                                exe: `${release.assets[2].browser_download_url}`,
                                winget: `${release.assets[4].browser_download_url}`,
                                deb: `${release.assets[6].browser_download_url}`,
                                snap: `${release.assets[7].browser_download_url}`,
                            }
                        }
                    }, { upsert: true }));
                    console.log(`[mongo] Updated ${branch}`)
                    break;
                }
            }
    },
    async getLatestRelease(branch) {
        let release = mongo.db('bot').collection('releases').find({ _id: `${branch}` })
        release = await release.toArray()
        if (release.length == 0) { return null }
        return release[0]
    }
}
