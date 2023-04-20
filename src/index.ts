import { Client, GatewayIntentBits, Partials, Events, User, Collection, TextChannel, resolveColor, EmbedBuilder, Colors } from 'discord.js';
import 'dotenv/config';
import consola from 'consola';
import { readdirSync } from 'fs';
import { Player } from 'discord-player';

declare module 'discord.js' {
    export interface Client {
        amAPIToken: string;
        commands: Collection<unknown, any>;
        canPingKeefe: boolean;
        interactions: Collection<unknown, any>;
        replies: Collection<unknown, any>;
        player: Player;
        playerEmbeds: Map<string, any>;
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping
    ],
    partials: [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Reaction]
});
client.playerEmbeds = new Map();
client.player = new Player(client);
client.commands = new Collection();
client.interactions = new Collection();

const mainFolder = process.env.NODE_ENV === 'development' ? 'src' : 'build';
const fileType = process.env.NODE_ENV === 'development' ? '.ts' : '.js';

/** REGISTER COMMANDS */
const commandFolders = readdirSync(`./${mainFolder}/commands/`);
for (const folder of commandFolders) {
    const commandFiles = readdirSync(`./${mainFolder}/commands/${folder}`).filter((file) => file.endsWith(fileType));
    for (const file of commandFiles) {
        const { command } = await import(`./commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
        consola.info('\x1b[32m%s\x1b[0m', 'Registered Command:', command.data.name, command?.category);
    }
}

/** REGISTER INTERACTIONS */
const interactionFiles = readdirSync(`./${mainFolder}/interactions`).filter((file) => file.endsWith(fileType));
for (const file of interactionFiles) {
    const { interaction } = await import(`./interactions/${file}`);
    client.interactions.set(interaction.data.name, interaction);
    consola.info('\x1b[32m%s\x1b[0m', 'Registered Interaction:', interaction.data.name);
}

const eventFiles = readdirSync(`./${mainFolder}/events`).filter((file) => file.endsWith(fileType));
for (const file of eventFiles) {
    const event = (await import(`./events/${file}`)).default;
    consola.info(`Loaded event: ${event.name}`);
    if (event?.devOnly && process.env.NODE_ENV !== 'development') continue;
    if (event?.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.DISCORD_TOKEN);

/*** ERROR HANDLING ***/
process.on('unhandledRejection', (error: Error) => {
    consola.info('Unhandled Rejection');
    consola.error(error);
    consola.error(error.stack);
    (client.channels.cache.get(CiderGuildChannels.botLog) as TextChannel)?.send({ content: `Unhandled Rejection`, embeds: [createErrorEmbed(error)] });
});
process.on('uncaughtException', (error: Error) => {
    consola.info('Uncaught Exception');
    consola.error(error);
    consola.error(error.stack);
    (client.channels.cache.get(CiderGuildChannels.botLog) as TextChannel)?.send({ content: `Uncaught Exception`, embeds: [createErrorEmbed(error)] });
});

function createErrorEmbed(error: Error) {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(error.name)
        .setDescription(error.message) //@ts-ignore
        .addFields({ name: 'Origin', value: `\`\`\`${error.stack?.slice(0, 1024)}\`\`\`` });
}
