// Import the functions you need from the SDKs you need
import consola from 'consola'
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import serviceAccount from '../data/serviceAccountKey.json' assert { type: 'json' };
import 'dotenv/config'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp({
    credential: cert(serviceAccount)
});

const firestore = getFirestore(app);
consola.success("\x1b[32m%s\x1b[0m", '[firebase]', "Connected")

export const firebase = {
    async commandCounter(command) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/commands/${command}`)
            analytics.update('count', FieldValue.increment(1), 'lastUsed', Timestamp.now()).catch(() => analytics.set({ count: 0, lastUsed: Timestamp.now() }))
        }
        catch (e) {
            consola.error(e)
        }
    },
    async replyCounter(reply) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/replies/${reply}`)
            analytics.update('count', FieldValue.increment(1), 'lastUsed', Timestamp.now()).catch(() => analytics.set({ count: 0, lastUsed: Timestamp.now() }))
        }
        catch (e) {
            consola.error(e)
        }
    },
    async syncReleaseData(branch) {
        try {
            let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases?per_page=100`)
            releases = await releases.json()
            consola.info(releases)
            releases.sort((a, b) => { return Date.parse(b.published_at) - Date.parse(a.published_at) })
            for (let release of releases) {
                if (String(release.name).split(' ')[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') === branch) {
                    let dmg, pkg, exe, winget, AppImage, deb, snap;
                    for (let asset of release.assets) {
                        consola.info(asset.name)
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
                    let analytics = firestore.doc(`cider-bot/releases/cider-1/${branch}`)
                    analytics.update(
                        'tag', release.tag_name,
                        'lastUpdated', Timestamp.fromDate(new Date(release.published_at)),
                        'timestamp', Timestamp.now(),
                        'releaseID', release.id,
                        'links', { dmg, pkg, exe, winget, AppImage, deb, snap }
                    )
                    return;
                }
            }
        }
        catch (e) {
            consola.error(e)
        }
    },
    async getLatestRelease(branch) {
        try {
            let analytics = firestore.doc(`cider-bot/releases/cider-1/${branch}`)
            let data = await analytics.get()
            return data.data()
        }
        catch (e) {
            consola.error(e)
        }
    },
    async getActiveUsers() {
        try {
            let analytics = firestore.doc(`cider-bot/users`)
            let data = await analytics.get()
            return data.data().active
        }
        catch (e) {
            consola.error(e)
        }
    },
    async setActiveUsers(count) {
        try {
            let analytics = firestore.doc(`cider-bot/users`)
            analytics.update('active', count)
        }
        catch (e) {
            consola.error(e)
        }
    },
    async getTotalUsers() {
        try {
            let analytics = firestore.doc(`cider-bot/users`)
            let data = await analytics.get()
            return data.data().total
        }
        catch (e) {
            consola.error(e)
        }
    },
    async setTotalUsers(count) {
        try {
            let analytics = firestore.doc(`cider-bot/users`)
            analytics.update('total', count)
        }
        catch (e) {
            consola.error(e)
        }
    },
    async getUserTimezone(id) {
        try {
            let analytics = firestore.doc(`cider-bot/users/timezone/${id}`)
            let data = await analytics.get()
            return data.data().timezone
        }
        catch (e) {
            consola.error(e)
        }
    },
    async setUserTimezone(id, timezone) {
        try {
            let analytics = firestore.doc(`cider-bot/users/timezone/${id}`)
            analytics.set({ timezone })
        }
        catch (e) {
            consola.error(e)
        }
    },
    async addServiceEvent(service, event) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/apple-services/${service}`)
            analytics.create({ events: [event] }).catch(() => analytics.update('events', FieldValue.arrayUnion(event)))
        }
        catch (e) {
            consola.error(e)
        }
    },
    async getServiceEvents(service) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/apple-services/${service}`)
            let data = await analytics.get()
            if(!data.data()) return []
            return data.data().events
        }
        catch (e) {
            consola.error(e)
        }
    }
}







