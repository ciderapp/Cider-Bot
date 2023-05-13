// Import the functions you need from the SDKs you need
import consola from 'consola'
import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import serviceAccount from '../data/serviceAccountKey.json' assert { type: 'json' };
import 'dotenv/config'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp({
    credential: cert(serviceAccount as ServiceAccount)
});

const firestore = getFirestore(app);

consola.success("\x1b[32m%s\x1b[0m", '[firebase]', "Connected")

export const firebase = {
    async commandCounter(command: string) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/commands/${command}`)
            analytics.update('count', FieldValue.increment(1), 'lastUsed', Timestamp.now()).catch(() => analytics.set({ count: 0, lastUsed: Timestamp.now() }))
        }
        catch (e) {
            consola.error(e)
        }
    },
    async replyCounter(reply: string) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/replies/${reply}`)
            analytics.update('count', FieldValue.increment(1), 'lastUsed', Timestamp.now()).catch(() => analytics.set({ count: 0, lastUsed: Timestamp.now() }))
        }
        catch (e) {
            consola.error(e)
        }
    },
    async syncReleaseData(branch: string) {
        consola.info(branch);
        switch(branch) {
            case 'cider2electron':
                firestore.doc(`cider-bot/releases/cider-2/${branch}`).set({ ready: false })
            case 'cider2uwp':
                firestore.doc(`cider-bot/releases/cider-2/${branch}`).set({ ready: false })
            default:
                try {
                    let releases: any[] = await (await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases/tags/v1.6.1?per_page=100`)).json()
                    releases.sort((a: any, b: any) => { return Date.parse(b.published_at) - Date.parse(a.published_at) })
                    for (let release of releases) {
                        if (String(release.name).split(' ')[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') === branch) {
                            let links = { 'dmg': '', 'pkg': '', 'exe': '', 'winget': '', 'AppImage': '', 'deb': '', 'snap': ''};
                            for (let asset of release.assets) {
                                switch (true) {
                                    case asset.name.endsWith('.dmg'): links.dmg = asset.browser_download_url; break;
                                    case asset.name.endsWith('.pkg'): links.pkg = asset.browser_download_url; break;
                                    case (asset.name.endsWith('.exe') && !asset.name.includes('-winget-')): links.exe = asset.browser_download_url; break;
                                    case (asset.name.endsWith('.exe') && asset.name.includes('-winget-')): links.winget = asset.browser_download_url; break;
                                    case asset.name.endsWith('.AppImage'): links.AppImage = asset.browser_download_url; break;
                                    case asset.name.endsWith('.deb'): links.deb = asset.browser_download_url; break;
                                    case asset.name.endsWith('.snap'): links.snap = asset.browser_download_url; break;
                                }
                            }
                            
                            let analytics = firestore.doc(`cider-bot/releases/cider-1/${branch}`)
                            analytics.set({
                                'tag' : release.tag_name,
                                'lastUpdated':  Timestamp.fromDate(new Date(release.published_at)),
                                'timestamp': Timestamp.now(),
                                'releaseID': release.id,
                                'links': links
                            })
                            return;
                        }
                    }
                }
                catch (e) {
                    consola.error(e)
                }
            break;                
        }
        
        
    },
    async getLatestRelease(branch: string) {
        try {
            if (branch == 'alpha') {
                const authKey = Buffer.from(`${process.env.AZURE_USER}:${process.env.AZURE_PAT}`).toString('base64');
                let runId = await fetch(`https://dev.azure.com/${process.env.AZURE_ORG}/${process.env.AZURE_PROJECT}/_apis/pipelines/1/runs?api-version=7.0`, { headers: { 'Authorization': `Basic ${authKey}` } })
                runId = (await runId.json()).count
                let release = await (await fetch(`https://dev.azure.com/${process.env.AZURE_ORG}/${process.env.AZURE_PROJECT}/_apis/build/builds/${runId}/artifacts?artifactName=Cider-UWP&api-version=7.0`, { headers: { 'Authorization': `Basic ${authKey}` } })).json()
                console.log(release)
                return release.resource.downloadUrl;
            }
            let analytics = firestore.doc(`cider-bot/releases/cider-1/${branch}`)
            if(branch.includes('cider2')) analytics = firestore.doc(`cider-bot/releases/cider-2/${branch}`)
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
            return data.data()!.active
        }
        catch (e) {
            consola.error(e)
        }
    },
    async setActiveUsers(count: number) {
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
            return data.data()!.total
        }
        catch (e) {
            consola.error(e)
        }
    },
    async setTotalUsers(count: number) {
        try {
            let analytics = firestore.doc(`cider-bot/users`)
            analytics.update('total', count)
        }
        catch (e) {
            consola.error(e)
        }
    },
    async getUserTimezone(id: string) {
        try {
            let analytics = firestore.doc(`cider-bot/users/timezone/${id}`)
            let data = await analytics.get()
            return data.data()!.timezone
        }
        catch (e) {
            consola.error(e)
        }
    },
    async setUserTimezone(id: string, timezone: string) {
        try {
            let analytics = firestore.doc(`cider-bot/users/timezone/${id}`)
            analytics.set({ timezone })
        }
        catch (e) {
            consola.error(e)
        }
    },
    async addServiceEvent(service: string, event: object) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/apple-services/${service}`)
            analytics.create({ events: [event] }).catch(() => analytics.update('events', FieldValue.arrayUnion(event)))
        }
        catch (e) {
            consola.error(e)
        }
    },
    async getServiceEvents(service: string) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/apple-services/${service}`)
            let data = await analytics.get()
            if (!data.data()) return []
            return data.data()!.events
        }
        catch (e) {
            consola.error(e)
        }
    },
    async addOpenAIEvent(event: object) {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/openai/events`)
            analytics.create({ events: [event] }).catch(() => analytics.update('events', FieldValue.arrayUnion(event)))
        }
        catch (e) {
            consola.error(e)
        }
    },
    async getOpenAIEvents() {
        try {
            let analytics = firestore.doc(`cider-bot/analytics/openai/events`)
            let data = await analytics.get()
            if (!data.data()) return []
            return data.data()!.events
        }  
        catch (e) {
            consola.error(e)
        }
    }
}







