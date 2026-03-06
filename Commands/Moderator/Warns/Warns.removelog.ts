import Discord, { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Infractions from '../../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('removelog')
        .setDescription('Removes a logged warning from a member of the discord.')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription("The user you'd like to remove a warning from.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('warning')
                .setDescription('The warning you\'d like to remove, alternatively "all" or "latest".')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const warningOption = interaction.options.getString('warning', true);

        if (warningOption === 'all') {
            await Infractions.deleteMany({
                guild: interaction.guild.id,
                user: user.id,
                type: 'warning',
            });

            return { embeds: [EmbedGenerator.basicEmbed('All warnings removed')], ephemeral: true };
        }

        const warnings = await Infractions.find({
            guild: interaction.guild.id,
            user: user.id,
            type: 'warning',
        }).sort({ time: -1 });

        if (warnings.length === 0) {
            return { embeds: [EmbedGenerator.errorEmbed('No warnings found')], ephemeral: true };
        }

        if (warningOption === 'latest') {
            const latestWarning = warnings[0]!;
            await Infractions.deleteOne({ _id: latestWarning._id });

            return { embeds: [EmbedGenerator.basicEmbed('Warning removed')], ephemeral: true };
        } else {
            const index = parseInt(warningOption);
            if (isNaN(index) || !warnings[index - 1]) {
                return { embeds: [EmbedGenerator.errorEmbed('Warning not found')], ephemeral: true };
            }

            const targetWarning = warnings[index - 1]!;
            await Infractions.deleteOne({ _id: targetWarning._id });

            return { embeds: [EmbedGenerator.basicEmbed('Warning removed')], ephemeral: true };
        }
    },
};
