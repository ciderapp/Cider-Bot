const { MongoClient } = require('mongodb');
const mongo = new MongoClient(require('../local').mongo());
const fetch = require('node-fetch')
module.exports = {
    async init() {
        await mongo.connect()
        console.log('[mongo] Connected!')
    },
    async addDonation(user) {
        mongo.db('bot').collection('donations').insertOne({
            _id: user.id,
            transactionID: user.transactionID,
        })
    },

}
