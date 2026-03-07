import Discord, { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import moment from 'moment';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Infractions from '../../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('view')
        .setDescription('View the logged kicks of a user.')
        .addUserOption((option) =>
            option.setName('user').setDescription("The user you'd like to view.").setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, _dbGuild: any, dbUser: any) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);

        const kicks = await Infractions.find({
            guild: interaction.guild.id,
            user: user.id,
            type: 'kick',
        }).sort({ time: -1 });

        if (kicks.length === 0) {
            return interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('No kicks found')],
                ephemeral: true,
            });
        }

        const embeds: EmbedBuilder[] = [];

        for (let i = 0; i < kicks.length; i += 10) {
            const kicksSlice = kicks.slice(i, i + 10);
            const embed = EmbedGenerator.basicEmbed(
                [
                    `Total Kicks: ${kicks.length}`,
                    `Latest Kick: <t:${moment(kicks[0]!.time).unix()}:f>`,
                    '',
                    ...kicksSlice.map(
                        (kick, index) =>
                            `**${i + index + 1}** • **${kick.reason}** • <@${kick.issuer}>`
                    ),
                ].join('\n')
            ).setAuthor({ name: `${user.tag} | Kicks`, iconURL: user.displayAvatarURL() });

            embeds.push(embed);
        }

        await EmbedGenerator.pagesEmbed(interaction, embeds, false, dbUser?.language);
    },
};
