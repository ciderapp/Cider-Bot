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
            return
        }
    },

}
