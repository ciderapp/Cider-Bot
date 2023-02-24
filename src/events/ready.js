import 'dotenv/config';
import { ActivityType, EmbedBuilder, Events } from 'discord.js';
import { getServiceStatus } from "../integrations/serviceStatus.js";
import { firebase } from "../integrations/firebase.js";

export const event = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        consola.success(`Logged in as ${client.user.tag} at ${Date()}`);
        if (process.env.NODE_ENV === 'development') return; // Don't run in development
        const Guilds = client.guilds.cache.map(guild => guild.name);
        let guild = client.guilds.cache.get(process.env.guildId);
        await syncAppleApiStatus(guild);
        await syncOpenAIStatus(guild);
        setInterval(() => { syncOpenAIStatus(guild); }, 300000);
        setInterval(() => { syncAppleApiStatus(guild); }, 300000);
        client.user.setActivity(`${client.guilds.cache.size} servers`, { type: ActivityType.Listening });
        guild.channels.cache.get(process.env.errorChannel).send({ embeds: [{ color: 0x00ff00, title: `Bot Initialized <t:${Math.trunc(Date.now() / 1000)}:R>`, description: `Commands: ${client.commands.size}\nServers: ${client.guilds.cache.size}\n\n **Server List**\n${Guilds.join('\n')}` }] });
    }
}
async function syncAppleApiStatus(guild) {
    if (process.env.NODE_ENV != "production") return;
    let channel = guild.channels.cache.get(process.env.APPLE_STATUS_CHANNEL);
    let services = await getServiceStatus();
    if (services.length === 0) return
    let embeds = [];
    let statusEmoji = "";

    for (let service of services) {
        let found = false;
        let storedEvents = await firebase.getServiceEvents(service.serviceName)
        storedEvents.forEach(el => {
            if (el.messageId === service.event.messageId) found = true;
        });
        if (found) return;
        if (service.event.eventStatus === "resolved" || service.event.eventStatus === "completed") statusEmoji = "🟢";
        else if (service.event.eventStatus === "ongoing") statusEmoji = "🟠";
        else if (service.event.eventStatus === "scheduled" || service.event.eventStatus === "upcoming" ) statusEmoji = "🟡";
        else statusEmoji = "🔴";
        let embed = new EmbedBuilder()
            .setAuthor({ name: service.serviceName, url: service.redirectUrl, iconURL: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png" })
            .setDescription(`${statusEmoji} ${service.event.statusType} - ${service.event.usersAffected}\n\n${service.event.message}`)
            .setFields([{ name: "Status", value: `${service.event.eventStatus}`, inline: true }, { name: "Message ID", value: service.event.messageId, inline: true }, { name: "Affected Service", value: service.event.affectedServices || service.serviceName, inline: true }])
            .setTimestamp();
        if (service.event.epochStartDate) embed.addFields({ name: "Start Date", value: `<t:${service.event.epochStartDate / 1000}:R>`, inline: true });
        if (service.event.epochEndDate) embed.addFields({ name: "End Date", value: `<t:${service.event.epochEndDate / 1000}:R>`, inline: true });
        if (service.event.eventStatus === "resolved") embed.setColor([0, 255, 0]);
        else if (service.event.eventStatus === "ongoing") embed.setColor([255, 180, 0]);
        embeds.push(embed);
        await firebase.addServiceEvent(service.serviceName, service.event)
    }
    channel.send({ embeds })
}
async function syncOpenAIStatus(guild) {
    if(process.env.NODE_ENV != "production") return;
    let channel = guild.channels.cache.get(process.env.APPLE_STATUS_CHANNEL);
    let res = await fetch(`https://status.openai.com/api/v2/incidents.json`);
    res = await res.json();
    if(res.incidents.length == 0) return;

    for(let incident of res.incidents) {
        let found = false;
        let storedEvents = await firebase.getOpenAIEvents();
        storedEvents.forEach(el => {
            if (el.id === incident.id && el.incident_updates.length == incident.incident_updates.length) found = true;
        });
        if (found) return;
        await firebase.addOpenAIEvent(incident);
        let current = {
            name: incident.resolved_at ? "Resolved Date" : " Last Updated",
            date: incident.resolved_at ? `<t:${Math.floor(Date.parse(incident.resolved_at) / 1000)}:f>` : `<t:${Math.floor(Date.parse(incident.incident_updates[0].updated_at) / 1000)}:R>` 
        }
        let status_indicator = "";
        let status_color = [0,0,0];
        switch(incident.status) {
            case "postmortem" :
            case "resolved" : status_indicator = "🟢"; status_color= [0, 255, 0]; break;
            case "investigating" : status_indicator = "🟠"; status_color= [255, 127, 0]; break;
            case "identified" : 
            case "monitoring" : status_indicator = "🟡"; status_color = status_color = [255, 255, 0]; break;
            default: status_indicator = "🔴"; status_color = [255, 0, 0]; break;
        }
        consola.info(incident, current, status_indicator)
        let embed = new EmbedBuilder()
            .setAuthor({ name: "OpenAI Status", url: "https://status.openai.com/", iconURL: "https://openai.com/content/images/2022/05/openai-avatar.png" })
            .setTitle(`${status_indicator} [${incident.impact}] ${incident.name}`)
            .setDescription(incident.incident_updates[0].body)
            .setFields({ name: "Start Date", value: `<t:${Math.floor(Date.parse(incident.started_at) / 1000)}:f>`, inline: true }, { name: `${current.name}`, value: current.date, inline: true })
            .setTimestamp();
        if(incident.incident_updates[0].affected_components) embed.addFields({ name: "Affected Services", value: incident.incident_updates[0].affected_components.map(el => el.name + ' - ' + el.new_status).join("\n")})
            
        embed.setColor(status_color);
        
        channel.send({ embeds: [embed] });
    } 
}