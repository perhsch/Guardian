import Discord, {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Infractions from '../../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('removelog')
        .setDescription('Removes a logged timeout from a member of the discord.')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription("The user you'd like to remove a timeout from.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('timeout')
                .setDescription(
                    'The timeout you\'d like to remove, alternatively "all" or "latest".'
                )
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const timeoutOption = interaction.options.getString('timeout', true);

        if (timeoutOption === 'all') {
            await Infractions.deleteMany({
                guild: interaction.guild.id,
                user: user.id,
                type: 'timeout',
            });

            return { embeds: [EmbedGenerator.basicEmbed('All timeouts removed')], ephemeral: true };
        }

        const timeouts = await Infractions.find({
            guild: interaction.guild.id,
            user: user.id,
            type: 'timeout',
        }).sort({ time: -1 });

        if (timeouts.length === 0) {
            return { embeds: [EmbedGenerator.errorEmbed('No timeouts found')], ephemeral: true };
        }

        if (timeoutOption === 'latest') {
            const latestTimeout = timeouts[0]!;
            await Infractions.deleteOne({ _id: latestTimeout._id });

            return { embeds: [EmbedGenerator.basicEmbed('Timeout removed')], ephemeral: true };
        } else {
            const index = parseInt(timeoutOption);
            if (isNaN(index) || !timeouts[index - 1]) {
                return {
                    embeds: [EmbedGenerator.errorEmbed('Timeout not found')],
                    ephemeral: true,
                };
            }

            const targetTimeout = timeouts[index - 1]!;
            await Infractions.deleteOne({ _id: targetTimeout._id });

            return { embeds: [EmbedGenerator.basicEmbed('Timeout removed')], ephemeral: true };
        }
    },
};
