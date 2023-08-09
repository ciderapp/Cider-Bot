import 'dotenv/config';
import { readdirSync } from 'fs';
import { REST, Routes } from 'discord.js';

const commands = [];

const commandFolders = readdirSync('./src/commands/');
for (const folder of commandFolders) {
    const commandFiles = readdirSync(`./build/commands/${folder}`).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const { command } = await import(`./build/commands/${folder}/${file}`);
        commands.push(command.data);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.\n' + commands.map((c) => c.name).join(', '));
} catch (error) {
    console.error(error);
}
