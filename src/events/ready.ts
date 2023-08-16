import { ActivityType, Client, ColorResolvable, EmbedBuilder, Events, Guild, GuildBasedChannel, TextChannel } from 'discord.js';
import { playerEvents } from '../integrations/discord-player.js';
import { getAPIToken } from '../integrations/musickitAPI.js';
import { firebase } from '../integrations/firebase.js';
import { getServiceStatus } from '../integrations/serviceStatus.js';
import { readFileSync, writeFileSync } from 'node:fs';
import consola from 'consola';
import 'dotenv/config';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client<true>) {
        client.amAPIToken = await getAPIToken();
        // await client.player.extractors.loadDefault();
        consola.success(`Logged in as ${client.user.tag}`);
        client.user.setActivity('Starting up...', { type: ActivityType.Playing });
        const Guilds = client.guilds.cache.map((guild) => guild.name);
        let guild = client.guilds.cache.get(CiderServers.main);
        await syncAppleApiStatus(guild!);
        await syncOpenAIStatus(guild!);
        setInterval(() => {
            syncOpenAIStatus(guild!);
        }, 300000);
        setInterval(() => {
            syncAppleApiStatus(guild!);
        }, 300000);
        client.user.setActivity(`${client.guilds.cache.size} servers`, { type: ActivityType.Listening });
        // playerEvents(client.player);
        checkSelfUpdate(client);
        if (process.env.NODE_ENV === 'development') return client.user.setPresence({ activities: [{ name: '⚙️ in development' }], status: 'idle' });
    }
};
async function syncAppleApiStatus(guild: Guild) {
    if (process.env.NODE_ENV != 'production') return;
    let channel = guild.channels.cache.get(CiderGuildChannels.appleServices);
    let services = await getServiceStatus();
    if (services?.length === 0) return;
    let embeds = [];
    let statusEmoji = '';

    for (let service of services!) {
        let found = false;
        let storedEvents = await firebase.getServiceEvents(service.serviceName);
        storedEvents.forEach((el: { messageId: string }) => {
            if (el.messageId === service.event.messageId) found = true;
        });
        if (found) return;
        if (service.event.eventStatus === 'resolved' || service.event.eventStatus === 'completed') statusEmoji = '🟢';
        else if (service.event.eventStatus === 'ongoing') statusEmoji = '🟠';
        else if (service.event.eventStatus === 'scheduled' || service.event.eventStatus === 'upcoming') statusEmoji = '🟡';
        else statusEmoji = '🔴';
        let embed = new EmbedBuilder()
            .setAuthor({ name: service.serviceName, url: service.redirectUrl, iconURL: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png' })
            .setDescription(`${statusEmoji} ${service.event.statusType} - ${service.event.usersAffected}\n\n${service.event.message}`)
            .setFields([
                { name: 'Status', value: `${service.event.eventStatus}`, inline: true },
                { name: 'Message ID', value: service.event.messageId, inline: true },
                { name: 'Affected Service', value: service.event.affectedServices || service.serviceName, inline: true }
            ])
            .setTimestamp();
        if (service.event.epochStartDate) embed.addFields({ name: 'Start Date', value: `<t:${service.event.epochStartDate / 1000}:R>`, inline: true });
        if (service.event.epochEndDate) embed.addFields({ name: 'End Date', value: `<t:${service.event.epochEndDate / 1000}:R>`, inline: true });
        if (service.event.eventStatus === 'resolved') embed.setColor([0, 255, 0]);
        else if (service.event.eventStatus === 'ongoing') embed.setColor([255, 180, 0]);
        embeds.push(embed);
        await firebase.addServiceEvent(service.serviceName, service.event);
    }
    (channel as TextChannel).send({ embeds });
}
async function syncOpenAIStatus(guild: Guild) {
    if (process.env.NODE_ENV != 'production') return;
    let channel = guild.channels.cache.get(CiderGuildChannels.appleServices);
    let res: any = await fetch(`https://status.openai.com/api/v2/incidents.json`);
    res = await res.json();
    if (res.incidents.length == 0) return;

    for (let incident of res.incidents) {
        let found = false;
        let storedEvents = await firebase.getOpenAIEvents();
        storedEvents.forEach((el: any) => {
            if (el.id === incident.id && el.incident_updates.length == incident.incident_updates.length) found = true;
        });
        if (found) return;
        await firebase.addOpenAIEvent(incident);
        let current = {
            name: incident.resolved_at ? 'Resolved Date' : ' Last Updated',
            date: incident.resolved_at ? `<t:${Math.floor(Date.parse(incident.resolved_at) / 1000)}:f>` : `<t:${Math.floor(Date.parse(incident.incident_updates[0].updated_at) / 1000)}:R>`
        };
        let status_indicator = '';
        let status_color = [0, 0, 0] as ColorResolvable;
        switch (incident.status) {
            case 'postmortem':
            case 'resolved':
                status_indicator = '🟢';
                status_color = [0, 255, 0];
                break;
            case 'investigating':
                status_indicator = '🟠';
                status_color = [255, 127, 0];
                break;
            case 'identified':
            case 'monitoring':
                status_indicator = '🟡';
                status_color = status_color = [255, 255, 0];
                break;
            default:
                status_indicator = '🔴';
                status_color = [255, 0, 0];
                break;
        }
        consola.info(incident, current, status_indicator);
        let embed = new EmbedBuilder()
            .setAuthor({ name: 'OpenAI Status', url: 'https://status.openai.com/', iconURL: 'https://openai.com/content/images/2022/05/openai-avatar.png' })
            .setTitle(`${status_indicator} [${incident.impact}] ${incident.name}`)
            .setDescription(incident.incident_updates[0].body)
            .setFields({ name: 'Start Date', value: `<t:${Math.floor(Date.parse(incident.started_at) / 1000)}:f>`, inline: true }, { name: `${current.name}`, value: current.date, inline: true })
            .setTimestamp();
        if (incident.incident_updates[0].affected_components) embed.addFields({ name: 'Affected Services', value: incident.incident_updates[0].affected_components.map((el: any) => el.name + ' - ' + el.new_status).join('\n') });

        embed.setColor(status_color);

        (channel as TextChannel).send({ embeds: [embed] });
    }
}

function checkSelfUpdate(client: Client<true>) {
    if (process.env.NODE_ENV != 'production' || readFileSync('./update.lock', 'utf-8') == process.env.npm_package_version) return;
    client.guilds.cache.forEach(async (guild) => {
        // if(guild.id != CiderServers.testServer) return;
        let channel = guild.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(client.user!)?.has('SendMessages') && c.name == 'general') as TextChannel;
        if (!channel) channel = guild.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(client.user!)?.has('SendMessages')) as TextChannel;
        let changelog = ['- Removed Music capability due to Apple Music API changes (might spawn a new bot just for music)'];
        channel.send({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: 'Cider Bot Updates', iconURL: client.user?.displayAvatarURL() })
                    .setTitle(`:tada: Updated to v${process.env.npm_package_version}`)
                    .setDescription(`**Changelog**\n\n${changelog.join('\n')}}`)
            ]
        });
        writeFileSync('./update.lock', `${process.env.npm_package_version}`);
    });
}
