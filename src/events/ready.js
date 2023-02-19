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
    }
    channel.send({ embeds })
}