const { MongoClient } = require('mongodb');
const mongo = new MongoClient(require('../local').mongo());
const fetch = require('node-fetch')
module.exports = {
    async init() {
        await mongo.connect()
        console.log('[mongo] Connected!')
    },
    async addDonation(transaction, userId) {
        try {
            mongo.db('connect').collection('users').updateOne({ _id: userId }, { $addToSet: { donations: transaction } }, { upsert: true })
        } catch (e) {
            console.log("Mongo Not Available. \n" + e)
        }
        return
    },
    async commandCounter(command) {
        try {
            mongo.db('bot')
                .collection('analytics')
                .updateOne({ name: `command-${command}` }, { $set: { lastUsed: Date.now() }, $inc: { count: 1 } }, { upsert: true })
        } catch (e) {
            console.log("Mongo Not Available. \n" + e)
        }

    },
    async replyCounter(reply) {
        try {
            mongo
                .db('bot')
                .collection('analytics')
                .updateOne({ name: `autoreply-${reply}` }, { $set: { lastUsed: Date.now() }, $inc: { count: 1 } }, { upsert: true })
        } catch (e) {
            console.log("Mongo Not Availible. \n" + e)
        }

    },
    async logRPMetadata(listenerData) {
        try {
            mongo
                .db('bot')
                .collection('rp-data')
                .updateOne({ song: `${listenerData.songName} - ${listenerData.artistName}` }, { $set: { lastListened: Date.now() }, $inc: { count: 1 }, $addToSet: { listeners: listenerData.userid } }, { upsert: true })
        } catch (e) {
            console.log("Mongo Not Available. \n" + e)
        }

    },
    async syncReleaseData(branch) {
        let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases?per_page=100`)
        releases = await releases.json()
        let macDmg = ""; let macPkg = "";
        if(branch == 'develop') {
            macDmg = "https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.dmg"
            macPkg = "https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.pkg"
        }
        for (let release of releases) {
            if (String(release.name).split(' ')[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') === branch) {
                mongo.db('bot')
                    .collection('releases')
                    .updateOne({ branch: `${branch}` }, { $set: { tag: `${release.tag_name}`, lastUpdated: `${release.published_at}`, releaseID: `${release.id}`, links: {
                        AppImage:   `${release.assets[1].browser_download_url}`,
                        exe:        `${release.assets[2].browser_download_url}`,
                        winget:     `${release.assets[4].browser_download_url}`,
                        deb:        `${release.assets[6].browser_download_url}`,
                        snap:       `${release.assets[7].browser_download_url}`,
                        dmg:       `${macDmg}`,
                        pkg:       `${macPkg}`, }
                    } }, { upsert: true });
                console.log(`[mongo] Updated ${branch} details`)
                // return release if not empty
                    return release
            }  
        }
        // return null if no release found
        return null
    },
    async getLatestRelease(branch) {
        let release = mongo.db('bot').collection('releases').find({ branch: `${branch}` })
        release = await release.toArray()
        if (release.length == 0) { return null }
        return release[0]
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
    async setActiveUsers(count){
        mongo.db('bot').collection('analytics').updateOne({ name: 'currActiveUsers' }, { $set: { count: count } }, { upsert: true })
    },
    async setTotalUsers(count) {
        mongo.db('bot').collection('analytics').updateOne({ name: 'totalUsers' }, { $set: { count: count } }, { upsert: true })
    }
}
