import { BaseInteraction, ChatInputCommandInteraction, Client, Events } from 'discord.js'
import consola from 'consola'
export default {
    name: Events.InteractionCreate,
    once: false,
    execute(interaction: BaseInteraction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                command.execute(interaction);
            }
            catch (error) {
                console.error(error);
                interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
        else if (interaction.isButton()) {
            consola.info(interaction.customId);
            const command = interaction.client.commands.get(interaction.customId);
            if (!command) return;
            try {
                command.execute(interaction);
            }
            catch (error) {
                console.error(error);
                interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                command.autocomplete(interaction);
            }
            catch (error) {
                console.error(error);
            }
        } else if(interaction.isStringSelectMenu()) {
            const command = interaction.client.interactions.get(interaction.customId);
            if (!command) return;
            try {
                command.execute(interaction);
            }
            catch (error) {
                console.error(error);
            }
        }


    }
}
