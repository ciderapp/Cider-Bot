const Discord = require('discord.js');
const auth = require('./tokens.json');
const client = new Discord.Client({
    intents: [ Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MEMBERS ]
});

client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag} at`);
 console.log(Date())
});

client.on('presenceUpdate', async (oldMember, newMember) => {
    const role = newMember.guild.roles.cache.get("932784788115427348");


    let using_cider = false
    for (const activity of newMember.activities){
        // 911790844204437504 - Cider
        // 886578863147192350 - Apple Music

        if (activity && (activity.applicationId === ( "911790844204437504" ) || (activity.applicationId === ( "886578863147192350" )))) {
            
            let listenerinfo = {
                userid: newMember.userId,
                userName: newMember.member.user.username,
                songName: activity.details
            }

            if (newMember.member._roles.includes("932784788115427348")) { // user already has listening role, no need to change roles
                console.log("\x1b[2m", "Listener updated -", listenerinfo)
                return // not changing any roles, just a log
            } else {
                console.log('\x1b[35m%s\x1b[0m', "Listener added -", listenerinfo)
                using_cider = true // code below will handle it
                break
            }
        
           
        }
    }
    
    if(using_cider){
        try {
            newMember.member.roles.add(role) // add listening on cider role
            if (!newMember.member._roles.includes("932816700305469510")) {
                newMember.member.roles.add("932816700305469510") // Add Cider User role.
            }
        } catch(e) {
            console.log("An error occurred. ",e)
        }
        
    } else { // Remove role if exists or ignore.
        try {
            if (newMember.member._roles.includes("932784788115427348")) {
                newMember.member.roles.remove("932784788115427348"); // remove listening on cider role
                let rmlistenerinfo = {
                    userid: newMember.userId,
                    userName: newMember.member.user.username,
                    dateRemoved: Date()
                }
                console.log("\x1b[33m%s\x1b[0m", "Listener removed -", rmlistenerinfo)
            }
        } catch(e) {
            console.log(e)
        }
    }
})

client.on('messageCreate', async message => {
    if (message.author.bot) return

    let link = message.content.match(/^(?!cider:\/\/).+(apple\.music\.com)([^\s]+)/gi)

    if (!link) return

    link = link[0].replace('https://', '')

    let new_link = "cider://" + link
    return message.reply('<:external:937230359890890803> Open in Cider <' + new_link + '>')
})

client.login(auth.token).then();
