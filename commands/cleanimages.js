const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleanimages')
        .setDescription('Gives you download links for the latest builds of a specified branch')
        .addChannelOption(option => option.setName('channel')
            .setDescription('Channel to purge images')
            .setRequired(true)
        ),
    async execute(interaction) {
        if (interaction.member._roles.includes('848363050205446165') || interaction.member._roles.includes('875082121427955802')) {
            let channel = interaction.options.getChannel('channel')
            // select all messages in channel
            let messages = await channel.messages.fetch({ limit: 100 })
            // filter out all messages have images
            let images = messages.filter(message => message.attachments.size > 0)
            //filter out messages that are older than a week
            let old = images.filter(message => message.createdAt < Date.now() - 604800000)
            //filter out all messages that not pinned
            let notpinned = old.filter(message => !message.pinned)

            // delete all images
            await notpinned.forEach(async message => {
                await message.delete()
            })
            //reply with how many images were deleted
            await interaction.reply({ content: `Deleted ${notpinned.size} images from ${channel}` })
        } else {
            interaction.reply({ content: 'You do not have permission to use this command.'})
        }
    }
}