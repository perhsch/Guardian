import Discord, { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import moment from 'moment';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Infractions from '../../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('view')
        .setDescription('View the logged warnings of a user.')
        .addUserOption((option) =>
            option.setName('user').setDescription("The user you'd like to view.").setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, _dbGuild: any, dbUser: any) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);

        const warnings = await Infractions.find({
            guild: interaction.guild.id,
            user: user.id,
            type: 'warning',
        }).sort({ time: -1 });

        if (warnings.length === 0) {
            return interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('No warnings found')],
                ephemeral: true,
            });
        }

        const embeds: EmbedBuilder[] = [];

        for (let i = 0; i < warnings.length; i += 10) {
            const warningsSlice = warnings.slice(i, i + 10);
            const embed = EmbedGenerator.basicEmbed()
                .setAuthor({ name: `${user.tag} | Warnings`, iconURL: user.displayAvatarURL() })
                .setDescription(
                    [
                        `Total Warnings: ${warnings.length}`,
                        `Latest Warning: <t:${moment(warnings[0]!.time).unix()}:f>`,
                        '',
                        ...warningsSlice.map(
                            (warning, index) =>
                                `**${i + index + 1}** • **${warning.reason}** • <@${warning.issuer}>`
                        ),
                    ].join('\n')
                );

            embeds.push(embed);
        }

        await EmbedGenerator.pagesEmbed(interaction, embeds, false, dbUser?.language);
    },
};
