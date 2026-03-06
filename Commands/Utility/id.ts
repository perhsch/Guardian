import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('id')
        .setDescription('Get the ID of a user or yourself.')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('The user you want to get the ID of')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const person = interaction.options.getUser('user') ?? interaction.user;
        const idEmbed = EmbedGenerator.basicEmbed()
            .setColor('#2f3136')
            .setDescription(`${person} 🔗 **${person.id}**`)
            .setFooter({ text: 'The ID of the user pinged.' });
        return interaction.reply({ embeds: [idEmbed] });
    },
};
