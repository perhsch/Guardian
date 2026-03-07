import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder().setName('time').setDescription('the current time and date'),

    async execute(interaction: ChatInputCommandInteraction) {
        const embed = EmbedGenerator.basicEmbed()
            .setTimestamp()
            .setThumbnail('https://cdn.discordapp.com/attachments/1080219392337522718/1081227919256457246/largepurple.png')
            .setColor('Purple')
            .setAuthor({ name: '⌚ Time Tool' })
            .setFooter({ text: '⌚ Fetched Date & Time' })
            .setTitle('> Current Date/Time')
            .addFields(
                { name: '• Time:', value: `> <t:${Math.floor(Date.now() / 1000)}:T>`, inline: true },
                { name: '• Date:', value: `> <t:${Math.floor(Date.now() / 1000)}:D>`, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    },
};
