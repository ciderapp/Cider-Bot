import { MongoClient } from 'mongodb';
import { default as tunnel } from 'tunnel-ssh';
import consola from 'consola';
import fetch from 'node-fetch';
import 'dotenv/config';

const client = new MongoClient(`mongodb://${process.env.MONGOHOST}:${process.env.MONGOPORT}`);

export const mongo = {
    async init() {
        if (process.env.NODE_ENV === 'development') {
            tunnel({
                username: process.env.SSH_USER,
                host: process.env.SSH_HOST,
                port: process.env.SSH_PORT,
                password: process.env.SSH_PASS,
                dstHost: process.env.SSH_DST_HOST,
                dstPort: process.env.SSH_DST_PORT,
                localHost: process.env.SSH_LOCAL_HOST,
                localPort: process.env.SSH_LOCAL_PORT,
            }, function (error, server) {
                if (error) { return console.log(error); }
                console.log(`[SSH] Successfully Connected to ${server.address().address} @ ${server.address().port}`);
            });
        }
        await client.connect()
        consola.success("\x1b[33m%s\x1b[0m", '[mongo]', 'Connected!')
    },
    async addDonation(transaction, userId) {
        try {
            client.db('connect').collection('users').updateOne({ _id: userId }, { $addToSet: { donations: transaction } }, { upsert: true })
        } catch (e) {
            consola.error("\x1b[33m%s\x1b[0m", '[mongo]', 'Not Available. \n' + e)
        }
        return
    },
    async commandCounter(command) {
        try {
            client.db('bot')
                .collection('analytics')
                .updateOne({ name: `command-${command}` }, { $set: { lastUsed: Date.now() }, $inc: { count: 1 } }, { upsert: true })
        } catch (e) {
            consola.error("\x1b[33m%s\x1b[0m", '[mongo]', 'Not Available. \n' + e)
        }

    },
    async replyCounter(reply) {
        try {
            client
                .db('bot')
                .collection('analytics')
                .updateOne({ name: `autoreply-${reply}` }, { $set: { lastUsed: Date.now() }, $inc: { count: 1 } }, { upsert: true })
        } catch (e) {
            consola.error("\x1b[33m%s\x1b[0m", '[mongo]', 'Not Available. \n' + e)
        }

    },
    async logSpotifyData(listener, activity) {
        let track = await fetch(`https://itunes.apple.com/search?term=${activity.details}%20by%20${activity.state}%20-%20${activity.assets.largeText}&country=US&entity=song`)
        track = await track.json()
        if (!track.results[0]) {
            track = await fetch(`https://itunes.apple.com/search?term=${activity.details}%20by%20${activity.state.split(";")[0]}%20-%20${activity.assets.largeText}&country=US&entity=song`)
            track = await track.json()
            if (!track.results[0]) {
                track = await fetch(`https://itunes.apple.com/search?term=${activity.details}%20by%20${activity.state}&country=US&entity=song`)
                track = await track.json()
                if (!track.results[0]) {
                    track = await fetch(`https://itunes.apple.com/search?term=${activity.details.split("(")[0]}%20by%20${activity.state}&country=US&entity=song`)
                    track = await track.json()
                }
            }
        }
        await client.db('connect').collection('users').updateOne({ id: listener.user.id }, {
            $set: {
                lastSpotifyTrack: {
                    artist: activity.state,
                    song: activity.details,
                    album: activity.assets.largeText,
                    url: `https://cider.sh/p?${track.results[0].trackViewUrl}`,
                }
            }
        }, { upsert: true })
    },
    async getSpotifyData(limit, userid) {
        // SELECT * FROM spotify-data WHERE userid = userid AND tracks.length >= limit
        let data = await client.db('bot').collection('spotify-data').findOne({ userid: userid })
        if (!data || data.tracks.length < limit) return null
        return data
    },
    async setUserIsBan(userid) {
        await client.db('bot').collection('spotify-data').updateOne({ userid: userid }, { $set: { isBanned: true } }, { upsert: true })
    },

    async dropRPMetadata() {
        try {
            client
                .db('bot')
                .dropCollection('rp-data')
        } catch (e) {
            consola.error("\x1b[33m%s\x1b[0m", '[mongo]', 'Not Available. \n' + e)
        }

    },
    async syncReleaseData(branch) {
        let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases?per_page=100`)
        releases = await releases.json()
        releases.sort((a, b) => { return Date.parse(b.published_at) - Date.parse(a.published_at) })
        for (let release of releases) {
            if (String(release.name).split(' ')[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') === branch) {
                let dmg, pkg, exe, winget, AppImage, deb, snap;
                for (let asset of release.assets) {
                    switch (true) {
                        case asset.name.endsWith('.dmg'): dmg = asset.browser_download_url; break;
                        case asset.name.endsWith('.pkg'): pkg = asset.browser_download_url; break;
                        case (asset.name.endsWith('.exe') && !asset.name.includes('-winget-')): exe = asset.browser_download_url; break;
                        case (asset.name.endsWith('.exe') && asset.name.includes('-winget-')): winget = asset.browser_download_url; break;
                        case asset.name.endsWith('.AppImage'): AppImage = asset.browser_download_url; break;
                        case asset.name.endsWith('.deb'): deb = asset.browser_download_url; break;
                        case asset.name.endsWith('.snap'): snap = asset.browser_download_url; break;
                    }
                }
                await client.db('bot').collection('releases').updateOne({ branch: `${branch}` }, {
                    $set: {
                        tag: `${release.tag_name}`,
                        lastUpdated: `${release.published_at}`,
                        jsDate: new Date(release.published_at).getTime(), //for timestamping
                        releaseID: `${release.id}`,
                        links: { dmg, pkg, AppImage, exe, winget, deb, snap }
                    }
                }, { upsert: true })
                consola.success("\x1b[33m%s\x1b[0m", '[mongo]', `Synced ${branch} release data.`)
                return;
            }
        }
    },
    async getLatestRelease(branch) {
        let release = client.db('bot').collection('releases').find({ branch: `${branch}` })
        release = await release.toArray()
        if (!release.length == 0) { consola.info("\x1b[33m%s\x1b[0m", '[mongo]', `Found ${branch} release`); return release[0] }
        return null
    },
    // async funtion that gets count of currActiveUsers in analytics collection

    async getActiveUsers(mode) {
        let activeUsers = client.db('bot').collection('analytics').find({ name: 'currActiveUsers' })
        activeUsers = await activeUsers.toArray()
        if (activeUsers.length == 0) { return 0 }
        return activeUsers[0].count
    },

    async addServiceEvent(service, event) {
        client.db('bot').collection('services').updateOne({ name: service, messageId: event.messageId }, { $set: { eventStatus: event.eventStatus } }, { upsert: true })
    },
    async getServiceEvents(service) {
        let events = client.db('bot').collection('services').find({ name: service })
        events = await events.toArray()
        if (events.length == 0) { return [] }
        return events
    },
    async incrementActiveUsers() {
        client.db('bot').collection('analytics').updateOne({ name: 'currActiveUsers' }, { $inc: { count: 1 } }, { upsert: true })
    },
    async decrementActiveUsers() {
        client.db('bot').collection('analytics').updateOne({ name: 'currActiveUsers' }, { $inc: { count: -1 } }, { upsert: true })
    },
    async incrementTotalUsers() {
        client.db('bot').collection('analytics').updateOne({ name: 'totalUsers' }, { $inc: { count: 1 } }, { upsert: true })
    },
    async getTotalUsers() {
        let totalUsers = client.db('bot').collection('analytics').find({ name: 'totalUsers' })
        totalUsers = await totalUsers.toArray()
        if (totalUsers.length == 0) { return 0 }
        return totalUsers[0].count
    },
    async setActiveUsers(count) {
        client.db('bot').collection('analytics').updateOne({ name: 'currActiveUsers' }, { $set: { count: count } }, { upsert: true })
    },
    async setTotalUsers(count) {
        client.db('bot').collection('analytics').updateOne({ name: 'totalUsers' }, { $set: { count: count } }, { upsert: true })
    },
    async getUserTimezone(userid) {
        let user = await client.db('bot').collection('users').find({ id: userid })
        user = await user.toArray()
        if (user.length == 0) { return null }
        return user[0].timezone
    },
    async setUserTimezone(userid, timezone) {
        await client.db('bot').collection('users').updateOne({ id: userid }, { $set: { timezone: timezone } }, { upsert: true })
    },
    async emailExists(email, userId) {
        const count = await client.db('bot').collection('emailsUsed').countDocuments({ email: email, userId: userId });
        if (count > 0) { return true }
        else { return false };
    },
    async addEmail(email, userId) {
        const emailExists = await client.db('bot').collection('emailsUsed').findOne({ email: email });

        if (!emailExists) {
            await client.db('bot').collection('emailsUsed').insertOne({ email: email, userId: userId });
        }
    },
}
