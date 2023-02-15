import { Events, resolveColor } from 'discord.js';
import { firebase } from "../integrations/firebase.js";
export const event = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        // if (!interaction.isChatInputCommand()) return;
        if (interaction.isStringSelectMenu()) {
            if (!interaction.client.interactions.get(interaction.customId)) return;
            try {
                await interaction.client.interactions.get(interaction.customId).execute(interaction);
            } catch (error) {
                consola.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
                await interaction.member.guild.channels.cache.get(process.env.errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
            }
        } else if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {

                firebase.commandCounter(interaction.commandName)
                await command.execute(interaction);
            } catch (error) {
                consola.error(error);
                await interaction.reply({ title: "Error", content: 'There was an error while executing this command!', ephemeral: true });
                let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
                await interaction.member.guild.channels.cache.get(process.env.errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
            }
        } else if (interaction.isMessageComponent()) {
            try {
                if (interaction.customId.split('|')[1] != null) {
                    await interaction.client.interactions.get(interaction.customId.split('|')[0]).execute(interaction);
                } else {
                    const command = interaction.client.commands.get(interaction.customId);
                    firebase.commandCounter(interaction.commandName)
                    await command.execute(interaction);
                }
            } catch (error) {
                consola.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
                await interaction.member.guild.channels.cache.get(process.env.errorChannel).send({ content: `There was an error executing ${interaction.commandName}`, embeds: [errorEmbed] })
            }

        }
    }
}