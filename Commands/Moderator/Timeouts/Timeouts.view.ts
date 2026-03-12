import Discord, {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
} from 'discord.js';
import moment from 'moment';
import ms from 'ms';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Infractions from '../../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('view')
        .setDescription('View the logged timeouts of a user.')
        .addUserOption((option) =>
            option.setName('user').setDescription("The user you'd like to view.").setRequired(true)
        ),

    async execute(
        interaction: ChatInputCommandInteraction,
        _client: Client,
        _dbGuild: any,
        dbUser: any
    ) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);

        const timeouts = await Infractions.find({
            guild: interaction.guild.id,
            user: user.id,
            type: 'timeout',
        }).sort({ time: -1 });

        if (timeouts.length === 0) {
            return interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('No timeouts found')],
                ephemeral: true,
            });
        }

        const embeds: EmbedBuilder[] = [];

        for (let i = 0; i < timeouts.length; i += 10) {
            const timeoutsSlice = timeouts.slice(i, i + 10);
            const embed = EmbedGenerator.basicEmbed()
                .setAuthor({ name: `${user.tag} | Timeouts`, iconURL: user.displayAvatarURL() })
                .setDescription(
                    [
                        `Total Timeouts: ${timeouts.length}`,
                        `Latest Timeout: <t:${moment(timeouts[0]!.time).unix()}:f>`,
                        '',
                        ...timeoutsSlice.map(
                            (timeout, index) =>
                                `**${i + index + 1}** • ${ms(timeout.duration || 0, {
                                    long: true,
                                })} • **${timeout.reason}** • <@${timeout.issuer}>`
                        ),
                    ].join('\n')
                );

            embeds.push(embed);
        }

        await EmbedGenerator.pagesEmbed(interaction, embeds, false, dbUser?.language);
    },
};
