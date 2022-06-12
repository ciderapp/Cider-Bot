const mongo = require('../integrations/mongo');
const cider_guild = require('../local').guildId();
module.exports = {
    name: 'presenceUpdate',

    async execute(oldMember, newMember) {
        //If role not found in guild, do nothing.
        try { if (oldMember.guild.id !== cider_guild || newMember.guild.id !== cider_guild) return } catch (e) { return }
        // or else it'll go BONK
        const role = newMember.guild.roles.cache.get("932784788115427348");
        let using_cider = false
        let client = newMember.client
        
        for (const activity of newMember.activities) {
            
            // 911790844204437504 - Cider
            // 886578863147192350 - Apple Music
            /* Continue last spotify song on Cider */
            if (activity && activity.name === "Spotify" && activity.type === "LISTENING") {
                await mongo.logSpotifyData(newMember, activity).catch(e => { })
            }
            if (activity && (activity.applicationId === ("911790844204437504") || (activity.applicationId === ("886578863147192350")))) {
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
                    try {
                        mongo.incrementActiveUsers().then(() => {
                            mongo.getActiveUsers().then(users => {
                                activeUsers = users;
                                client.user.setActivity(`${activeUsers} / ${totalUsers} Active Cider Users`, { type: 'WATCHING' });
                            })
                        })
                    } catch (e) {
                        consola.error("An error occurred. ", e)
                    }
                    using_cider = true // code below will handle it
                    break
                }
            }
        }
        if (using_cider) {
            try {
                newMember.member.roles.add(role) // add listening on cider role
                if (!newMember.member._roles.includes("932816700305469510")) {
                    try {
                        newMember.member.roles.add("932816700305469510")
                        mongo.incrementTotalUsers().then(() => {
                            mongo.getTotalUsers().then(users => {
                                totalUsers = users;
                                client.user.setActivity(`${activeUsers} / ${totalUsers} Active Cider Users`, { type: 'WATCHING' });
                            })
                        })
                    } catch (e) {
                        consola.error("An error occurred while adding role. ", e)
                    } // Add Cider User role.
                }
            } catch (e) {
                consola.error("An error occurred. ", e)
            }
    
        } else { // Remove role if exists or ignore.
            try {
                if (newMember.member._roles.includes("932784788115427348")) {
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
                    try {
                        mongo.decrementActiveUsers().then(() => {
                            mongo.getActiveUsers().then(users => {
                                activeUsers = users;
                                client.user.setActivity(`${activeUsers} / ${totalUsers} Active Cider Users`, { type: 'WATCHING' });
                            })
                        })
                    } catch (e) {
                        consola.error("An error occurred. ", e)
                    }
                }
            } catch (e) {
                consola.error(e)
            }
        }
    }
}