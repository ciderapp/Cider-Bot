import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderator commands')
        // .setDefaultMemberPermissions([Permissions.FLAGS.KICK_MEMBERS])
        .addSubcommand(subcommand => subcommand
            .setName('kick')
            .setDescription('Kicks a user from the server')
            .addUserOption(option => option.setName('user')
                .setDescription('User to kick')
                .setRequired(true))
            .addStringOption(option => option.setName('reason')
                .setDescription('Reason for kicking')
                .setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('ban')
            .setDescription('Bans a user from the server')
            .addUserOption(option => option.setName('user')
                .setDescription('User to ban')
                .setRequired(true))
            .addStringOption(option => option.setName('reason')
                .setDescription('Reason for banning')
                .setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('mute')
            .setDescription('Mutes a user from the server')
            .addUserOption(option => option.setName('user')
                .setDescription('User to mute')
                .setRequired(true))
            .addStringOption(option => option.setName('reason')
                .setDescription('Reason for muting')
                .setRequired(true))
            .addNumberOption(option => option.setName('time')
                .setDescription('Time in minutes for the mute')
                .setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('unmute')
            .setDescription('Unmutes a user from the server')
            .addUserOption(option => option.setName('user')
                .setDescription('User to unmute')
                .setRequired(true))),

    async execute(interaction) {
        let adminchannel = "932110086929780777";
        if (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802') || true) {
            let user = interaction.options.getUser('user');
            if (interaction.guild.members.cache.get(user.id).moderatable) {
                if (interaction.options.getSubcommand() === 'kick') {
                    let reason = interaction.options.getString('reason');
                    //interaction.guild.members.cache.get(user.id).send(`You have been kicked from **${interaction.guild.name}** for: *${reason}*`);
                    //interaction.guild.members.cache.get(user.id).kick(reason);
                    //interaction.reply({ content: `${user} has been kicked.` });

                    // if (!user.kickable) return interaction.reply({
                    //     embeds: [new EmbedBuilder().setColor('Red').setDescription(`I cannot kick ${user}`)]
                    // })

                    if (user.id === interaction.user.id) return interaction.reply({
                        embeds: [new EmbedBuilder().setColor('Red').setDescription(`You cannot kick yourself, you ratrted piece of sh*t`)]
                    })

                    const approval = await approvalFunction(
                        interaction,
                        new EmbedBuilder()
                            .setColor('Random')
                            .setTitle('Waiting for Approval')
                            .setDescription(`Are you sure you want to ${interaction.options.getSubcommand()} ${user} for ${reason}?\nYou have a minute to respond.`)
                    )

                    if (approval.approve) {
                        const embed = new EmbedBuilder()
                            .setColor('Green')
                            .setTitle('Approved')
                            .setDescription(`${user} was kicked for ${reason}.`);

                            try {
                                await user.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor('Red')
                                            .setTitle('You have been kicked')
                                            .setDescription(`You have been kicked from ${interaction.guild.name} for ${reason} on ${time(new Date(), 'F')}`)
                                    ]
                                });
                            }catch(e) {
                                embed.setFooter(`${user} could not be notified.`)
                            }

                            await interaction.followUp({
                                embeds: [embed]
                            })

                            await user.kick({ reason: reason }); // The problem is either here or here actually
                    }

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Cancelled')
                        .setDescription(`${user} was not kicked.`)

                    if (approval.reason) embed.setFooter({ text: approval.reason })

                    await interaction.followUp({
                        embeds: [embed]
                    })


                }
                else if (interaction.options.getSubcommand() === 'ban') {
                    let reason = interaction.options.getString('reason');
                    await interaction.guild.members.cache.get(user.id).timeout(86400000 * 28, reason);
                    interaction.member.guild.channels.cache.get(adminchannel).send({ content: `<@191621342473224192>, A Mod has requested a ban for ${user}\nReason: ${reason}\nRequested by: ${interaction.user}` })
                    interaction.guild.members.cache.get(user.id).send(`You have are muted and have been screened to a ban from **${interaction.guild.name}** with the reason of: *${reason}*`);
                    interaction.reply({ content: `${user} has been screened for a ban.` });
                }
                else if (interaction.options.getSubcommand() === 'mute') {
                    let reason = interaction.options.getString('reason');
                    let time = interaction.options.getNumber('time');
                    await interaction.guild.members.cache.get(user.id).timeout(time * 60 * 1000, reason);
                    interaction.guild.members.cache.get(user.id).send(`You have been muted for **${time}** minutes for the following reason: *${reason}*`);
                    interaction.reply({ content: `${user} has been muted for ${time} minutes.` });
                }
                else if (interaction.options.getSubcommand() === 'unmute') {
                    await interaction.guild.members.cache.get(user.id).timeout(0);
                    interaction.guild.members.cache.get(user.id).send(`You have been unmuted`);
                    interaction.reply({ content: `${user} has been unmuted.` });
                }
            } else {
                interaction.reply({ content: `${user.username} is too powerful.` });
            }
        } else {
            interaction.reply({ content: 'You do not have permissions to use this command.', type: 'error', ephemeral: true });
        }
    }
}

const approvalFunction = async (interaction, embed) => { //yes
    const interactionMessage = await interaction.reply({
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Approve').setStyle(ButtonStyle.Success).setCustomId('approve'),
                new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('cancel'),
            )
        ],
        fetchReply: true
    });

    const interactionEvent = await interactionMessage.awaitMessageComponent({ time: 60000, filter: i => i.user.id === interaction.user.id}).catch(() => null);

    if (!interactionEvent) return {
        approve: false,
        reason: 'Reason: Timeout',
    }; 

    if (interactionEvent.customId === 'approve') {
        interactionEvent.deferUpdate();
        interaction.editReply({
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel('Approve').setStyle(ButtonStyle.Success).setCustomId('approve').setDisabled(true),
                    new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('cancel').setDisabled(true),
                )
            ]
        })
        return {
            approve: true,
        }
    } else if (interactionEvent.customId === 'cancel') {
        interactionEvent.deferUpdate();
        interaction.editReply({
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel('Approve').setStyle(ButtonStyle.Success).setCustomId('approve').setDisabled(true),
                    new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('cancel').setDisabled(true),
                )
            ]
        })
        return {
            approve: false,
        }
    }
} 