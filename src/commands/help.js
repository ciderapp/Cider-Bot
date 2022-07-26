import { SlashCommandBuilder, EmbedBuilder, SelectMenuBuilder, ActionRowBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName('help').setDescription('Displays help commands'),
    category: 'Help',
    description: 'Displays help commands',
    async execute(interaction) {
        let { client } = await import('../index.js');
        let categories = [];
        client.commands.each(command => {
            if (!categories.includes(command.category)) {
                categories.push(command.category);
            }
        })

        const reply = {
            embeds: [
                new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Help')
                    .setDescription('Use the dropdown menu provided below and select a category'),
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new SelectMenuBuilder()
                            .setCustomId('help-dropdown')
                            .setPlaceholder('Select a category')
                            .addOptions([
                                ...categories.map(category => {
                                    return {
                                        label: category,
                                        value: category,
                                        description: `Displays all commands in ${category}`,
                                    }
                                })
                            ])
                    )
            ]
        }

        interaction.reply({
            ...reply,
            fetchReply: true
        }).then(async msg => {
            const collector = msg.createMessageComponentCollector({
            time: 120000, 
        })
        collector.on('collect', async component => {
            console.log(component)
            if (component.user.id !== interaction.user.id) return await component.reply({ content: `These components are not for you my guy`, ephemeral: true });
            const categoryValue = component.values[0];
            if (categories.includes(categoryValue))
                return await component.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Random')
                            .setTitle(`Help - ${categoryValue}`)
                            .setDescription(client.commands.filter(cmd => cmd.category === categoryValue).map(cmd => `\`${cmd.data.name}\` - ${cmd.data.description}`).join('\n')),
                    ]
                })
        })

        collector.on('end', async collected => {
            return msg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Help')
                        .setDescription('This help menu has been disabled, use this command again to open another help menu'),
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new SelectMenuBuilder()
                                .setCustomId('help-dropdown')
                                .setPlaceholder('Select a category')
                                .setDisabled(true)
                                .addOptions([
                                    ...categories.map(category => {
                                        return {
                                            label: category,
                                            value: category,
                                            description: `Displays all commands in ${category}`,
                                        }
                                    })
                                ])
                        )
                ]
            })
        })
        })
    }
}