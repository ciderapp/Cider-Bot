import { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ChatInputCommandInteraction } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays help commands'),
    category: 'Support',
    async execute(interaction: ChatInputCommandInteraction) {
        let client = interaction.client;
        let applicationCommands = await client.application.commands.fetch();
        let categories: string[] = [];
        client.commands.each((command) => {
            if (!categories.includes(command.category)) {
                categories.push(command.category);
            }
        });
        let msg = await interaction.reply({ 
            content: '',
            embeds: [new EmbedBuilder().setColor('Random').setTitle('Help').setDescription('Use the dropdown menu provided below and select a category')],
            components: [ // @ts-ignore
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('help-dropdown')
                        .setPlaceholder('Select a category')
                        .addOptions([
                            ...categories.map((category) => {
                                return {
                                    label: category,
                                    value: category,
                                    description: `Displays all commands in ${category}`
                                };
                            })
                        ])
                )
            ],    
            fetchReply: true 
        });
        const collector = msg.createMessageComponentCollector({ time: 120000 });
        collector.on('collect', async (component: any) => {
            if(component.user.id !== interaction.user.id) return await component.reply({ content: `These components are not for you my guy`, ephemeral: true });
            const categoryValue = component.values[0];
            if(categories.includes(categoryValue)) return await component.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Random')
                        .setTitle(`Help - ${categoryValue}`)
                        .setDescription(client.commands.filter((cmd) => cmd.category === categoryValue).map((cmd) => `</${cmd.data.name}:${applicationCommands.find((command) => command.name === cmd.data.name)!.id}> - ${cmd.data.description}`).join('\n'))
                ],
            });
        });

        collector.on("end", async (collected) => {
            await msg.edit({
                embeds: [new EmbedBuilder().setColor('Random').setTitle('Help').setDescription('This help menu has been disabled, use this command again to open another help menu')],
                components: [ // @ts-ignore
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('help-dropdown')
                            .setPlaceholder('Select a category')
                            .setDisabled(true)
                            .addOptions([
                                ...categories.map((category) => {
                                    return {
                                        label: category,
                                        value: category,
                                        description: `Displays all commands in ${category}`
                                    };
                                })
                            ])
                    )
                ]
            });
        });
    }
};
