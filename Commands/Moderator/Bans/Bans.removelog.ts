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
        .setDescription('Removes a logged ban from a member of the discord.')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription("The user you'd like to remove a ban from.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('ban')
                .setDescription('The ban you\'d like to remove, alternatively "all" or "latest".')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const banOption = interaction.options.getString('ban', true);

        if (banOption === 'all') {
            await Infractions.deleteMany({
                guild: interaction.guild.id,
                user: user.id,
                type: 'ban',
                active: false,
            });

            return {
                embeds: [EmbedGenerator.basicEmbed('All inactive bans removed')],
                ephemeral: true,
            };
        }

        const bans = await Infractions.find({
            guild: interaction.guild.id,
            user: user.id,
            type: 'ban',
        }).sort({ time: -1 });

        if (bans.length === 0) {
            return { embeds: [EmbedGenerator.errorEmbed('No bans found')], ephemeral: true };
        }

        if (banOption === 'latest') {
            const latestBan = bans[0]!;
            if (latestBan.active) {
                return {
                    embeds: [EmbedGenerator.errorEmbed('Unable to remove an active ban')],
                    ephemeral: true,
                };
            }
            await Infractions.deleteOne({ _id: latestBan._id });

            return { embeds: [EmbedGenerator.basicEmbed('Ban removed')], ephemeral: true };
        } else {
            const index = parseInt(banOption);
            if (isNaN(index) || !bans[index - 1]) {
                return { embeds: [EmbedGenerator.errorEmbed('Ban not found')], ephemeral: true };
            }

            const targetBan = bans[index - 1]!;
            if (targetBan.active) {
                return {
                    embeds: [EmbedGenerator.errorEmbed('Unable to remove an active ban')],
                    ephemeral: true,
                };
            }

            await Infractions.deleteOne({ _id: targetBan._id });

            return { embeds: [EmbedGenerator.basicEmbed('Ban removed')], ephemeral: true };
        }
    },
};
