import 'dotenv/config';
import { readdirSync } from 'fs';
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'

let auth = process.env.bot_token
let clientId = process.env.bot_clientId

const commands = [];
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const { command } = await import(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(auth);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.\n' + commands.map(c => c.name).join('\n'));
    } catch (error) { console.error(error); }
})();
