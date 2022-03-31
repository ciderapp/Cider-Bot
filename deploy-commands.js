const { SlashCommandBuilder, SlashCommandStringOption, ContextMenuCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
let auth;
if (process.argv[2] && process.argv[2] === '-t') {
  let flagIndex = process.argv.indexOf('-t');
  let tokenValue = process.argv[flagIndex + 1];
  auth = { "token": tokenValue }
} else {
  auth = require('./tokens.json');
}
const clientId = '921475709694771252';
const guildId = '843954443845238864';
const fetch = require('node-fetch');


fetch('https://api.github.com/repos/ciderapp/cider/branches').then(async(branches) => {
    branches = await branches.json()
    let branchMenu = new SlashCommandStringOption().setName('branch').setDescription('The branch to get builds from.').setRequired(true);

    branches.forEach(branch => {
        branchMenu.addChoice(branch.name, branch.name)
    });

    const commands = [
            new SlashCommandBuilder().setName('nightly').setDescription('Gives you download links for the latest nightly builds').addBooleanOption(option => option.setName('show').setDescription('Show to everyone!').setRequired(false)),
            new SlashCommandBuilder().setName('branchbuilds').setDescription('Gives you download links for the latest builds of a specified branch').addStringOption(branchMenu).addBooleanOption(option => option.setName('show').setDescription('Show to everyone!').setRequired(false)),
            new SlashCommandBuilder().setName('macos').setDescription('Shows available macOS builds (Signed for M1 and Intel Macs)').addBooleanOption(option => option.setName('show').setDescription('Show to everyone!').setRequired(false)),
            new SlashCommandBuilder().setName('sauceme').setDescription('Gives you a random extra saucy image (18+)'),
            new SlashCommandBuilder().setName('marin').setDescription('Gives you a random picture of our godess Marin Kitagawa'),
            new SlashCommandBuilder().setName('donate').setDescription('Responds to \"How donate????\"').addUserOption(option => option.setName('user').setDescription('User to repond to')),
            new SlashCommandBuilder().setName('discordrpc').setDescription('Responds to \"why discord no work????\"').addUserOption(option => option.setName('user').setDescription('User to repond to'))
        ]
        .map(command => command.toJSON());

    const rest = new REST({ version: '9' }).setToken(auth.token);

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
    await rest.put(Routes.applicationCommands(clientId), { body: commands })
        .then(() => console.log('Successfully registered global application commands.'))
        .catch(console.error);
})
