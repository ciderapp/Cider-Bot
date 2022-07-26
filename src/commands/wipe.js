import { SlashCommandBuilder} from 'discord.js';
import leaderboard from '../leaderboard.json' assert { type: 'json'};
export const command = {
    data: new SlashCommandBuilder()
        .setName('wipe')
        .setDescription('Wipes the server with unknown people (to be used by mods only)'),
    async execute(interaction) {
        const allowedRoles = new RegExp(/940857872437366834|940857989311647774|983606804049186847|585183518427054084/g)
        const MEE6Excemption = new RegExp(`${leaderboard.players.map(player => player.id).join('|')}`, 'g')
        if (allowedRoles.test(interaction.member._roles.toString())) {
            await interaction.reply({ content: `:detective: Wiping the server...` });
            const allmembers = interaction.guild.members.cache
            const filtered = allmembers.filter(member => member.roles.cache.size === 1) // members with only 1 role (@everyone)
            const filtered2 =  filtered.filter(member => !MEE6Excemption.test(member.id)) // members not in the MEE6 leaderboard
            consola.info(`${interaction.member.tag} has requested a wipe. on ${filtered2.size} out of ${allmembers.size} members`)
            filtered2.forEach(async member => {
                // kick the member
                await member.kick({ reason: `You were kicked from ${interaction.guild.name} for inactivity` }) 
            });
            await interaction.editReply({ content: `:detective: Wiped *${filtered2.size}* out of ${allmembers.size} members.` });
        }
        else { await interaction.reply({ content: `:detective: You do not have the permission to wipe the server.`, ephemeral: true }); }
            
    }
}