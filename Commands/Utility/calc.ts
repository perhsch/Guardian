import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { create, all } from 'mathjs';
const math = create(all);
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('Calculate numbers!')
        .addStringOption((option) =>
            option.setName('expression').setDescription('Example : 2*3+5').setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const expression = interaction.options.getString('expression', true);
        let result: unknown;
        try {
            result = math.evaluate(expression);
        } catch {
            const fail = EmbedGenerator.basicEmbed()
                .setColor('#2f3136')
                .setDescription(`🔢 **Write your expression**\n\n> \`/calc 5*2+9\``);
            return interaction.reply({ embeds: [fail], ephemeral: true });
        }

        const calc = EmbedGenerator.basicEmbed()
            .setColor('#2f3136')
            .setDescription(`🤖 **${expression}**\n\n> ${result}`);
        return interaction.reply({ embeds: [calc] });
    },
};
