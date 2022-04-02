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
        mongo.db('bot').collection('analytics').updateOne({ _id: `${command}` }, { $set: { lastUsed: Date.now()}, $inc: { count: 1} }, { upsert: true })
    },
    async logRPMetadata(listenerData) {
        mongo.db('bot').collection('rp-data').updateOne({ _id: `${listenerData.songName} - ${listenerData.artistName}` }, { $set: { lastListened: Date.now()}, $inc: { count: 1}, $push: { listeners: listenerData.userid } }, { upsert: true })
    }

}
