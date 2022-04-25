const { SlashCommandBuilder } = require('@discordjs/builders');
const faqEmbed = require('../faq.json');
module.exports = {
    data: new SlashCommandBuilder().setName('faqupdate').setDescription('Updates the FAQ page"')
        .addBooleanOption(option => option.setName('publish').setDescription('set to true to publish in FAQ channel').setRequired(false)),
    async execute(interaction) {
        if (interaction.member._roles.includes('848363050205446165')) {
            let publish = interaction.options.getBoolean('publish') || false
            if (publish) {
                interaction.member.guild.channels.cache.get("911395772803735612").send({ embeds: faqEmbed.embeds })
                interaction.reply({ content: '<#911395772803735612> page updated!' })
            }
            else { interaction.reply({ content: `To publish, set publish to \`true\``, embeds: faqEmbed.embeds }) }
        } else {
            interaction.reply({ content: 'You do not have permission to use this command.'})
        }


    },
};