import Discord, { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Infractions from '../../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('removelog')
        .setDescription('Removes a logged kick from a member of the discord.')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription("The user you'd like to remove a kick from.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('kick')
                .setDescription('The kick you\'d like to remove, alternatively "all" or "latest".')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const kickOption = interaction.options.getString('kick', true);

        if (kickOption === 'all') {
            await Infractions.deleteMany({
                guild: interaction.guild.id,
                user: user.id,
                type: 'kick',
            });

            return { embeds: [EmbedGenerator.basicEmbed('All kicks removed')], ephemeral: true };
        }

        const kicks = await Infractions.find({
            guild: interaction.guild.id,
            user: user.id,
            type: 'kick',
        }).sort({ time: -1 });

        if (kicks.length === 0) {
            return { embeds: [EmbedGenerator.errorEmbed('No kicks found')], ephemeral: true };
        }

        if (kickOption === 'latest') {
            const latestKick = kicks[0]!;
            await Infractions.deleteOne({ _id: latestKick._id });

            return { embeds: [EmbedGenerator.basicEmbed('Kick removed')], ephemeral: true };
        } else {
            const index = parseInt(kickOption);
            if (isNaN(index) || !kicks[index - 1]) {
                return { embeds: [EmbedGenerator.errorEmbed('Kick not found')], ephemeral: true };
            }

            const targetKick = kicks[index - 1]!;
            await Infractions.deleteOne({ _id: targetKick._id });

            return { embeds: [EmbedGenerator.basicEmbed('Kick removed')], ephemeral: true };
        }
    },
};
