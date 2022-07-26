import { token, clientId } from './src/local.js';
import { readdirSync } from 'fs';
import { REST } from '@discordjs/rest'
import { Routes } from 'discord.js'

const commands = [];
const commandFiles = readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const { command } = await import(`./src/commands/${file}`);
    commands.push(command.data);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(clientId),{ body: commands });
        console.log('Successfully reloaded application (/) commands.\n' + commands.map(c => c.name).join(', '));
    } catch (error) {
        console.error(error);
    }
})();
