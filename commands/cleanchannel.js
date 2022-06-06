const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleanchannel')
        .setDescription('Purge all messages containing images/videos in a channel that are about a week old')
        .addChannelOption(option => option.setName('channel')
            .setDescription('Channel to purge images')
            .setRequired(true)
        )
        .addStringOption(option => option.setName('before')
            .setDescription('Message id to start purging from (optional)')
            .setRequired(false)
        ),

    async execute(interaction) {
        if (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802')) {
            let channel = interaction.options.getChannel('channel')
            let count = 0, countdel = 0
            await interaction.reply({ content: `Deleting all images in this channel...` })
            // select all messages in channel
            let before = interaction.options.getString('before')
            let messages = await channel.messages.fetch({ limit: 1})
            messages = await channel.messages.fetch({ limit: 100, before: before ? before : messages.last().id })
            todelete = messages.filter(message => message.attachments.size > 0 && message.createdTimestamp < Date.now() - 604800000 && !message.pinned)
            await channel.bulkDelete(todelete)
            countdel += todelete.size
            count += messages.size
            while (messages.last() != null) {
                //delete all messages that have images, and is older than one week, and is not pinned
                consola.info(messages.last().id)
                messages = await channel.messages.fetch({ limit: 100, before: messages.last().id })
                // consola.info(messages.size, messages.last().id)
                todelete = messages.filter(message => message.attachments.size > 0 && message.createdTimestamp < Date.now() - 604800000 && !message.pinned)
                await channel.bulkDelete(todelete)
                countdel += todelete.size
                count += messages.size
                await interaction.editReply({ content: `Deleted ${countdel}/${count} messages from ${channel}\nMessage Pointer: ${messages.last().id}` })
            }
        } else {
            interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true })
        }
    }
}