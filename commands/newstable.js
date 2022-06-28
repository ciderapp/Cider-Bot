import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Octokit } from '@octokit/core';
import { ghKey as gh_token } from '../local.js';

export const command = {
    data: new SlashCommandBuilder().setName('newstable').setDescription('Creates a pull request on Github (main -> stable)')
        .addStringOption(title => title.setName('title').setDescription('Title of the pull request').setRequired(true)),
    category: 'General',

    async execute(interaction) {
        if (interaction.member._roles.includes('848363050205446165')) {
            const octokit = new Octokit({ auth: gh_token });
            let pull = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
                owner: 'ciderapp',
                repo: 'cider',
                title: interaction.options.getString('title'),
                body: 'This pull request is intended to merge the main branch into the stable branch.',
                head: 'main',
                base: 'stable'
            })
            const pullEmbed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`${pull.data.title}`)
                .setURL(`${pull.data.html_url}`)
                .setDescription(`Commits: ${pull.data.commits} | Additions: ${pull.data.additions} | Deletions: ${pull.data.deletions} | Changed Files: ${pull.data.changed_files}`)
                .addFields({ name: 'Base', value: `${pull.data.base.ref}` }, { name: 'Head', value: `${pull.data.head.ref}` })
            consola.info(pull)
            await interaction.reply({ content: `Successfully made the pull request`, embeds: [pullEmbed] })
        } else {
            interaction.reply({ content: 'You do not have permission to use this command.' })
        }
    }
}