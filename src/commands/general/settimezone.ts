import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { firebase } from '../../integrations/firebase.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName('settimezone')
        .setDescription('Set your local timezone')
        .addStringOption((option) => option.setName('timezone').setDescription('Provide your local timezone').setAutocomplete(true).setRequired(true)),
    category: 'General',
    async autocomplete(interaction: AutocompleteInteraction) {
        let query = interaction.options.getFocused();
        return interaction.respond(
            // @ts-ignore
            Intl.supportedValuesOf('timeZone')
                .filter((timezone : string) => timezone.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 20)
                .map((timezone : string) => {
                    return {
                        name: timezone,
                        value: timezone
                    };
                })
        );
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const timezone = interaction.options.getString('timezone');

        function isValidTimeZone(tz: string | null) {
            try {
                if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
                    return false;
                }

                if (typeof tz !== 'string') {
                    return false;
                }

                Intl.DateTimeFormat(undefined, { timeZone: tz });
                return true;
            } catch (error) {
                return false;
            }
        }

        if (isValidTimeZone(timezone) == false) {
            interaction.reply({
                content: 'Invalid timezone provided. Refer to the supported timezones.',
                components: [
                    //@ts-ignore
                    new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL('https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a').setLabel('Supported Timezones'))
                ],
                ephemeral: true
            });
            return;
        } else {
            await firebase.getUserTimezone(interaction.user.id).then(async (returnTimezone) => {
                if (!returnTimezone) {
                    firebase.setUserTimezone(interaction.user.id, timezone as string);
                    interaction.reply({ content: `Timezone set to ${timezone}`, ephemeral: true });
                } else {
                    firebase.setUserTimezone(interaction.user.id, timezone as string);
                    interaction.reply({ content: `Timezone updated to ${timezone}`, ephemeral: true });
                }
            });
        }
    }
};
