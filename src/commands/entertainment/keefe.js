import { SlashCommandBuilder } from 'discord.js';
export const command = {
    data: new SlashCommandBuilder().setName('keefe').setDescription('Humiliate Keefe for using Spotify'),
    category: 'Emtertainment',
    async execute(interaction) {
        let { client } = await import('../../index.js');
        if(client.canPingKeefe){
            client.canPingKeefe = false;
            
            const message = await interaction.reply({ content: '<@728847567806267405>', files: [{ attachment: 'https://user-images.githubusercontent.com/71800112/174714799-e1141344-5cd1-4ea9-afff-651fe92fe2b0.png'}], fetchReply: true });
            await message.react('🤡');
            setTimeout(() => {
                client.canPingKeefe = true;
            }, 1000 * 60 * 60); // 1 hour
        } else {
            interaction.reply({content: "This command is in Cooldown", ephemeral: true});
        }
    }

}