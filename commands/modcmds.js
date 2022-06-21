import { SlashCommandBuilder, EmbedBuilder, Formatters, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder().setName('mod').setDescription('Moderator commands')
        // .setDefaultMemberPermissions([Permissions.FLAGS.KICK_MEMBERS])
        .addSubcommand(subcommand => subcommand
            .setName('kick')
            .setDescription('Kicks a user from the server')
            .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for kicking').setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('ban')
            .setDescription('Bans a user from the server')
            .addUserOption(option => option.setName('user').setDescription('User to ban').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for banning').setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('mute')
            .setDescription('Mutes a user from the server')
            .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for muting').setRequired(true))
            .addNumberOption(option => option.setName('time').setDescription('Time in minutes for the mute').setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('unmute')
            .setDescription('Unmutes a user from the server')
            .addUserOption(option => option.setName('user').setDescription('User to unmute').setRequired(true))),

    async execute(interaction) {
        if (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802')) {
            let user = interaction.options.getMember('user');
            let reason = interaction.options?.getString('reason');
            let time = interaction.options?.getNumber('time');
            if (interaction.guild.members.cache.get(user.id).moderatable) {
                if (user.id === interaction.user.id) return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription(`You cannot ${interaction.options.getSubcommand()} yourself, you retarded piece of sh*t`)]
                })
                if (interaction.options.getSubcommand() === 'kick') {
                    const approval = await approvalFunction(interaction, new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Waiting for Approval')
                        .setDescription(`Are you sure you want to ${interaction.options.getSubcommand()} ${user} for ${reason}?\nYou have a minute to respond.`)
                    )
                    if (approval.approve) {
                        await user.kick({ reason });
                    }
                } else if (interaction.options.getSubcommand() === 'ban') {
                    const approval = await approvalFunction(interaction, new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Waiting for Approval')
                        .setDescription(`Are you sure you want to ${interaction.options.getSubcommand()} ${user} for ${reason}?\nYou have a minute to respond.`)
                    )
                    if (approval.approve) {
                        await user.ban({ reason });
                    }
                } else if (interaction.options.getSubcommand() === 'mute') {
                    const approval = await approvalFunction(
                        interaction,
                        new EmbedBuilder()
                            .setColor('Random')
                            .setTitle('Waiting for Approval')
                            .setDescription(`Are you sure you want to ${interaction.options.getSubcommand()} ${user} for ${reason} till ${Formatters.time(Math.floor(Date.now() / 1000) + (time * 60), 'f')}?\nYou have a minute to respond.`)
                    )
                    if (approval.approve) {
                        await user.timeout(time * 60000, reason);
                    }
                } else if (interaction.options.getSubcommand() === 'unmute') {
                    const approval = await approvalFunction(interaction, new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Waiting for Approval')
                        .setDescription(`Are you sure you want to ${interaction.options.getSubcommand()} ${user}?\nYou have a minute to respond.`)
                    )
                    if (approval.approve) {
                        await user.timeout(null);
                    }
                }
            } else {
                interaction.reply({ content: `${user.username} is too powerful.` });
            }
        } else {
            interaction.reply({ content: 'You do not have permissions to use this command.', type: 'error', ephemeral: true });
        }
    }
}

const approvalFunction = async (interaction, embed) => {
    let user = interaction.options.getMember('user');
    let reason = interaction.options?.getString('reason');
    let time = interaction.options?.getNumber('time');
    let past = interaction.options.getSubcommand();
    switch (past) {
        case 'kick': past = 'kicked'; break;
        case 'ban': past = 'banned'; break;
        case 'mute': past = 'muted'; break;
        case 'unmute': past = 'unmuted'; break;
    }

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
    
    const collector = interactionMessage.createMessageComponentCollector({ time: 60_000, filter: (i) => i.user.id !== interaction.user.id });
    collector.on('collect', (i) => {
        i.reply({ content: `${i.user} You are not allowed to respond to this request.`, ephemeral: true });
    });
    const interactionEvent = await interactionMessage.awaitMessageComponent({ time: 60_000, filter: (i) => i.user.id === interaction.user.id }).catch((e) => { });
    if (interactionEvent.customId === 'approve') {
        interactionEvent.deferUpdate();
        await interaction.editReply({
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel('Approve').setStyle(ButtonStyle.Success).setCustomId('approve').setDisabled(true),
                    new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('cancel').setDisabled(true),
                )
            ]
        })
        const dmEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle(`You have been ${past}`)
        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Approved')
        switch (past) {
            case 'muted':
                dmEmbed.setDescription(`You have been muted from ${interaction.guild.name} for ${reason} on ${Formatters.time(new Date(), 'F')}\nYou'll be unmuted in ${Formatters.time(Math.floor(Date.now() / 1000) + (time * 60), 'R')}`);
                embed.setDescription(`${user} was muted for ${reason}.\nThey'll be unmuted in ${Formatters.time(Math.floor(Date.now() / 1000) + (time * 60), 'R')}`);
                break;
            case 'unmuted':
                dmEmbed.setColor('Green')
                dmEmbed.setDescription(`You have been unmuted from ${interaction.guild.name}`);
                embed.setDescription(`${user} is now ${past} `)
                break;
            default:
                dmEmbed.setDescription(`You have been ${past} from ${interaction.guild.name} for ${reason} on ${Formatters.time(new Date(), 'F')}`);
                embed.setDescription(`${user} was ${past} for \`${reason}.\``)
                break;
        }
        const dmMessage = await user.send({ embeds: [dmEmbed] });
        const serverMessage = await interaction.followUp({ embeds: [embed] });
        setTimeout(() => {
            dmMessage.delete();
            serverMessage.delete();
        }, time * 60000);
        return { approve: true }
    } else if (interactionEvent.customId === 'cancel' || !interactionEvent) {
        interactionEvent.deferUpdate();
        interaction.editReply({
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel('Approve').setStyle(ButtonStyle.Success).setCustomId('approve').setDisabled(true),
                    new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('cancel').setDisabled(true),
                )
            ]
        })
        const embed = new EmbedBuilder().setColor('Red').setTitle('Cancelled').setDescription(`${user.username} was not ${past}`)
        if (!interactionEvent) embed.setFooter({ text: 'Reason: Timeout' })
        await interaction.followUp({ embeds: [embed] })
    }
}