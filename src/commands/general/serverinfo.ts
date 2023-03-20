import { ActionRowBuilder, ActionRowComponentData, ActionRowData, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import consola from 'consola';
export const command = {
    data: new SlashCommandBuilder().setName("serverinfo").setDescription("Get info on the current server")
        .addSubcommand(subcommand => subcommand
            .setName('bans')
            .setDescription('Bans a user from the server')),
    category: 'General',
    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === 'bans') {
            let components : ActionRowData<ActionRowComponentData>[] = [];
            let bans = await interaction.guild!.bans.fetch();
            let bansArray = [...bans.values()]
            let bansEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(`Bans on **${interaction.guild!.name}**`)
                .setThumbnail(interaction.guild!.iconURL())
                .setDescription(`${bansArray.length > 0 ? bansArray.slice(0, 20).map((ban, i) => `${i + 1}.) **${ban.user.tag}**(||${ban.user.id}||) - ${ban.reason || 'no reason provided'}`).join('\n\n') : 'No bans'}`)
                .setFooter({ text: `Total Ban Count: ${bans.size}` })
            if(bansArray.length > 20) { //@ts-ignore
                components = [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setEmoji('⏪').setStyle(ButtonStyle.Secondary).setCustomId(`bansPages|${Math.floor(bansArray.length / 20 + 1)}`),
                    new ButtonBuilder().setEmoji('⏩').setStyle(ButtonStyle.Secondary).setCustomId(`bansPages|2`)
                )]
            }
            consola.info(bansArray)
            // consola.info("Bans:", bans);
            await interaction.reply({
                embeds: [bansEmbed], //@ts-ignore
                components
            });
        }
    }
}