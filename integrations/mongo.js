const { MongoClient } = require('mongodb');
const consola = require('consola');
const mongo = new MongoClient(require('../local').mongo());
const fetch = require('node-fetch')
module.exports = {
    async init() {
        await mongo.connect()
        consola.success("\x1b[33m%s\x1b[0m", '[mongo]', 'Connected!')
    },
    async addDonation(transaction, userId) {
        try {
            mongo.db('connect').collection('users').updateOne({ _id: userId }, { $addToSet: { donations: transaction } }, { upsert: true })
        } catch (e) {
            consola.error("\x1b[33m%s\x1b[0m", '[mongo]', 'Not Available. \n' + e)
        }
        return
    },
    async commandCounter(command) {
        try {
            mongo.db('bot')
                .collection('analytics')
                .updateOne({ name: `command-${command}` }, { $set: { lastUsed: Date.now() }, $inc: { count: 1 } }, { upsert: true })
        } catch (e) {
            consola.error("\x1b[33m%s\x1b[0m", '[mongo]', 'Not Available. \n' + e)
        }

    },
    async replyCounter(reply) {
        try {
            mongo
                .db('bot')
                .collection('analytics')
                .updateOne({ name: `autoreply-${reply}` }, { $set: { lastUsed: Date.now() }, $inc: { count: 1 } }, { upsert: true })
        } catch (e) {
            consola.error("\x1b[33m%s\x1b[0m", '[mongo]', 'Not Available. \n' + e)
        }

    },
    async logSpotifyData(listener, activity){
        let track = await fetch(`https://itunes.apple.com/search?term=${activity.details}%20by%20${activity.state}%20-%20${activity.assets.largeText}&country=US&entity=song`)
        track = await track.json()
        if(!track.results[0]){
            track = await fetch(`https://itunes.apple.com/search?term=${activity.details}%20by%20${activity.state.split(";")[0]}%20-%20${activity.assets.largeText}&country=US&entity=song`)
            track = await track.json()
            if(!track.results[0]){
                track = await fetch(`https://itunes.apple.com/search?term=${activity.details}%20by%20${activity.state}&country=US&entity=song`)
                track = await track.json()
                if(!track.results[0]){
                    track = await fetch(`https://itunes.apple.com/search?term=${activity.details.split("(")[0]}%20by%20${activity.state}&country=US&entity=song`)
                    track = await track.json()
                }
            }
        }
        await mongo.db('connect').collection('users').updateOne({ id: listener.user.id }, { $set: { lastSpotifyTrack: {
            artist: activity.state,
            song: activity.details,
            album: activity.assets.largeText,
            url: `https://cider.sh/p?${track.results[0].trackViewUrl}`,
        } } }, { upsert: true })
    },
    async getSpotifyData(limit, userid){
        // SELECT * FROM spotify-data WHERE userid = userid AND tracks.length >= limit
        let data = await mongo.db('bot').collection('spotify-data').findOne({ userid: userid })
        if(!data || data.tracks.length < limit) return null
        return data
    },
    async setUserIsBan(userid){
        await mongo.db('bot').collection('spotify-data').updateOne({ userid: userid }, { $set: { isBanned: true } }, { upsert: true })
    },

    async dropRPMetadata() {
        try {
            mongo
                .db('bot')
                .dropCollection('rp-data')
        } catch (e) {
            consola.error("\x1b[33m%s\x1b[0m", '[mongo]', 'Not Available. \n' + e)
        }

    },
    async syncReleaseData(branch) {
        let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases?per_page=100`)
        releases = await releases.json()
        let macDmg = ""; let macPkg = "";
        if (branch == 'main') {
            macDmg = "https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.dmg"
            macPkg = "https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.pkg"
        }
        for (let release of releases) {
            if (String(release.name).split(' ')[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') === branch) {
                await mongo.db('bot').collection('releases').updateOne({ branch: `${branch}` }, {
                    $set: {
                        tag: `${release.tag_name}`,
                        lastUpdated: `${release.published_at}`,
                        jsDate: new Date(release.published_at).getTime(), //for timestamping
                        releaseID: `${release.id}`,
                        links: {
                            AppImage: `${release.assets[0].browser_download_url}`,
                            exe: `${release.assets[1].browser_download_url}`,
                            winget: `${release.assets[3].browser_download_url}`,
                            deb: `${release.assets[5].browser_download_url}`,
                            snap: `${release.assets[6].browser_download_url}`,
                            dmg: `${macDmg}`,
                            pkg: `${macPkg}`,
                        }
                    }
                }, { upsert: true })
                consola.success("\x1b[33m%s\x1b[0m", '[mongo]', `Synced ${branch} release data.`)
                return;
            }
        }
    },
    async getLatestRelease(branch) {
        let release = mongo.db('bot').collection('releases').find({ branch: `${branch}` })
        release = await release.toArray()
        if (!release.length == 0) { consola.info("\x1b[33m%s\x1b[0m", '[mongo]', `Found ${branch} release`); return release[0] }
        return null
    },
    // async funtion that gets count of currActiveUsers in analytics collection

    async getActiveUsers(mode) {
        let activeUsers = mongo.db('bot').collection('analytics').find({ name: 'currActiveUsers' })
        activeUsers = await activeUsers.toArray()
        if (activeUsers.length == 0) { return 0 }
        return activeUsers[0].count
    },

    async incrementActiveUsers() {
        mongo.db('bot').collection('analytics').updateOne({ name: 'currActiveUsers' }, { $inc: { count: 1 } }, { upsert: true })
    },
    async decrementActiveUsers() {
        mongo.db('bot').collection('analytics').updateOne({ name: 'currActiveUsers' }, { $inc: { count: -1 } }, { upsert: true })
    },
    async incrementTotalUsers() {
        mongo.db('bot').collection('analytics').updateOne({ name: 'totalUsers' }, { $inc: { count: 1 } }, { upsert: true })
    },
    async getTotalUsers() {
        let totalUsers = mongo.db('bot').collection('analytics').find({ name: 'totalUsers' })
        totalUsers = await totalUsers.toArray()
        if (totalUsers.length == 0) { return 0 }
        return totalUsers[0].count
    },
    async setActiveUsers(count) {
        mongo.db('bot').collection('analytics').updateOne({ name: 'currActiveUsers' }, { $set: { count: count } }, { upsert: true })
    },
    async setTotalUsers(count) {
        mongo.db('bot').collection('analytics').updateOne({ name: 'totalUsers' }, { $set: { count: count } }, { upsert: true })
    }
}
