import { mongo } from '../integrations/mongo.js';
import 'dotenv/config';
import { listening } from '../data/roles.js';
import { ActivityType } from 'discord.js';

export const event = {
    name: 'presenceUpdate',

    async execute(oldMember, newMember) {
        //If role not found in guild, do nothing.
        try { if (oldMember.guild.id !== process.env.guildId || newMember.guild.id !== process.env.guildId) return } catch (e) { return }
        // or else it'll go BONK
        let using_cider = false;
        let { client } = await import('../index.js');
        for (const activity of newMember.activities) {
            let CiderRPCId = new RegExp('911790844204437504|886578863147192350', 'g');
            // 911790844204437504 - Cider
            // 886578863147192350 - Apple Music
            /* Continue last spotify song on Cider */
            if (activity && activity.name === "Spotify" && activity.type === ActivityType.Listening) {
                await mongo.logSpotifyData(newMember, activity).catch(e => { })
            }
            if (activity && CiderRPCId.test(`${activity.applicationID}`)) {
                let listenerinfo = {
                    userid: newMember.userId,
                    userName: newMember.member.user.username,
                    songName: activity.details,
                    artistName: String(activity.state).split("by ")[1],
                }

                if (newMember.member._roles.includes("932784788115427348")) { // user already has listening role, no need to change roles
                    consola.info("\x1b[2m", "Listener updated -", listenerinfo)
                    return // not changing any roles, just a log
                } else {
                    consola.info('\x1b[35m%s\x1b[0m', "Listener added -", listenerinfo)
                    client.activeUsers++;
                    client.user.setActivity(`${client.activeUsers} / ${client.totalUsers} Active Cider Users`, { type: ActivityType.Watching });
                    using_cider = true // code below will handle it
                    break
                }
            }
        }
        if (using_cider) {
            newMember.member.roles.add("932784788115427348") // add listening on cider role
            if (!newMember.member._roles.includes("932816700305469510")) {
                try {
                    newMember.member.roles.add("932816700305469510")
                    client.totalUsers++;
                    client.user.setActivity(`${client.activeUsers} / ${client.totalUsers} Active Cider Users`, { type: ActivityType.Watching });
                } catch (e) {
                    consola.error("An error occurred while adding role. ", e)
                } // Add Cider User role.
            }
        } else { // Remove role if exists or ignore.
            if (listening.test(newMember.member._roles)) {
                try {
                    newMember.member.roles.remove("932784788115427348"); // remove listening on cider role
                } catch (e) {
                    consola.error("An error occurred on role removal. ", e)
                }
                let rmlistenerinfo = {
                    userid: newMember.userId,
                    userName: newMember.member.user.username,
                    dateRemoved: Date()
                }
                consola.info("\x1b[33m%s\x1b[0m", "Listener removed -", rmlistenerinfo)
                client.activeUsers--;
                client.user.setActivity(`${client.activeUsers} / ${client.totalUsers} Active Cider Users`, { type: ActivityType.Watching });
            }
        }
    }
}