const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('./tokens.json');
const clientId = '921475709694771252';
const guildId = '843954443845238864';
const commands = [
        new SlashCommandBuilder().setName('nightly').setDescription('Gives you download links for the latest nightly builds').addBooleanOption(option => option.setName('show').setDescription('Show to everyone!').setRequired(false)),
        new SlashCommandBuilder().setName('branchbuilds').setDescription('Gives you download links for the latest builds of a specified branch').addStringOption(option => option.setName('branch').setDescription('The branch').setRequired(false))
    ]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);