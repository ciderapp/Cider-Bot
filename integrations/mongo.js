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
                .updateOne({ _id: `${command}` }, { $set: { lastUsed: Date.now()}, $inc: { count: 1} }, { upsert: true })
        } catch (e) {
            console.log("Mongo Not Available. \n" + e)
        }

    },
    async replyCounter(reply) {
        try {
            mongo
                .db('bot')
                .collection('analytics')
                .updateOne({ _id: `reply-${reply}` }, { $set: { lastUsed: Date.now()}, $inc: { count: 1} }, { upsert: true })
        } catch (e) {
            console.log("Mongo Not Availible. \n" + e)
        }

    },
    async logRPMetadata(listenerData) {
        try {
            mongo
                .db('bot')
                .collection('rp-data')
                .updateOne({ _id: `${listenerData.songName} - ${listenerData.artistName}` }, { $set: { lastListened: Date.now()}, $inc: { count: 1}, $addToSet: { listeners: listenerData.userid } }, { upsert: true })
        } catch (e) {
            console.log("Mongo Not Available. \n" + e)
        }

    },
    async syncLatestReleases(branch, release) {
        if(branch && release) {
            mongo.db('bot')
                .collection('releases')
                .updateOne({ _id: `${branch}` }, { $set: { tag: `${release.tag_name}`, lastUpdated: `${release.published_at}`, releaseID:`${release.id}` } }, { upsert: true });
            console.log(`[mongo] Updated ${branch}`)
        }
        else { console.log(`[mongo] Failed to sync latest release for branch ${branch}`) }
    },
    async getLatestRelease(branch) {
        let release = mongo.db('bot').collection('releases').find({ _id: `${branch}` })
        release = await release.toArray()
        if(release.length == 0) { return null }
        return release[0]
    },
    // async funtion that gets count of currActiveUsers in analytics collection

    async getActiveUsers(mode) {
        let activeUsers = mongo.db('bot').collection('analytics').find({ _id: 'currActiveUsers' })
        activeUsers = await activeUsers.toArray()
        if(activeUsers.length == 0) { return 0 }
        return activeUsers[0].count
    },
    async incrementActiveUsers() {
        mongo.db('bot').collection('analytics').updateOne({ _id: 'currActiveUsers' }, { $inc: { count: 1} }, { upsert: true })
    },
    async decrementActiveUsers() {
        mongo.db('bot').collection('analytics').updateOne({ _id: 'currActiveUsers' }, { $inc: { count: -1} }, { upsert: true })
    },
}
