import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import Infractions from '../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('automodlist')
        .setDescription('List all automod cases that have ever happened in this server')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles |
                PermissionFlagsBits.ManageChannels |
                PermissionFlagsBits.ModerateMembers
        )
        .setDMPermission(false)
        .addIntegerOption((option) =>
            option
                .setName('limit')
                .setDescription('Maximum number of cases to show (default: 20, max: 100)')
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('Filter by automod action type')
                .addChoices(
                    { name: 'All Types', value: 'all' },
                    { name: 'Warnings', value: 'warning' },
                    { name: 'Timeouts', value: 'timeout' },
                    { name: 'Message Deletions', value: 'delete' }
                )
        ),
    category: 'administrator',

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        if (!interaction.guild) return;

        const limit = interaction.options.getInteger('limit') || 20;
        const typeFilter = (interaction.options.getString('type') || 'all') as
            | 'all'
            | 'warning'
            | 'timeout'
            | 'delete';

        await interaction.deferReply();

        try {
            const query: any = {
                guild: interaction.guild.id,
                issuer: client.user!.id,
            };

            if (typeFilter !== 'all' && typeFilter !== 'delete') {
                query.type = typeFilter;
            }

            const automodInfractions = await Infractions.find(query)
                .sort({ time: -1 })
                .limit(limit);

            if (automodInfractions.length === 0) {
                const noCasesEmbed = EmbedGenerator.basicEmbed()
                    .setTitle('🔍 No Automod Cases Found')
                    .setDescription(
                        typeFilter === 'all'
                            ? 'No automod cases have been recorded in this server yet.'
                            : `No automod ${typeFilter} cases have been recorded in this server yet.`
                    )
                    .setColor('Yellow')
                    .setTimestamp();

                return interaction.editReply({ embeds: [noCasesEmbed] });
            }

            const stats: Record<string, number> = {
                warning: 0,
                timeout: 0,
                total: automodInfractions.length,
            };

            automodInfractions.forEach((inf) => {
                if (stats[inf.type] !== undefined) {
                    stats[inf.type]++;
                }
            });

            const embed = EmbedGenerator.basicEmbed()
                .setTitle('🛡️ Automod Cases History')
                .setDescription(
                    `Showing **${automodInfractions.length}** recent automod case${automodInfractions.length === 1 ? '' : 's'}${typeFilter !== 'all' ? ` (${typeFilter})` : ''}\n\n` +
                        `**Statistics:**\n` +
                        `⚠️ Warnings: **${stats['warning']}**\n` +
                        `⏰ Timeouts: **${stats['timeout']}**\n` +
                        `📊 Total Shown: **${stats['total']}**`
                )
                .setColor('Blue')
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });

            const casesList = automodInfractions.map((infraction, index) => {
                const date = new Date(infraction.time).toLocaleDateString();
                const time = new Date(infraction.time).toLocaleTimeString();
                const user = `<@${infraction.user}>`;

                let actionIcon = '';
                let actionText = '';

                switch (infraction.type) {
                    case 'warning':
                        actionIcon = '⚠️';
                        actionText = 'Warning';
                        break;
                    case 'timeout':
                        actionIcon = '⏰';
                        actionText = 'Timeout (1h)';
                        break;
                    default:
                        actionIcon = '🔧';
                        actionText = infraction.type;
                }

                const reason =
                    infraction.reason.length > 50
                        ? infraction.reason.substring(0, 47) + '...'
                        : infraction.reason;

                return (
                    `**#${index + 1}** ${actionIcon} ${actionText}\n` +
                    `👤 User: ${user}\n` +
                    `📅 Date: ${date} ${time}\n` +
                    `📝 Reason: ${reason}`
                );
            });

            const chunks: string[] = [];
            let currentChunk = '';

            casesList.forEach((caseText) => {
                const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + caseText;

                if (testChunk.length > 1024) {
                    if (currentChunk) {
                        chunks.push(currentChunk);
                        currentChunk = caseText;
                    } else {
                        chunks.push(caseText.substring(0, 1021) + '...');
                    }
                } else {
                    currentChunk = testChunk;
                }
            });

            if (currentChunk) {
                chunks.push(currentChunk);
            }

            const embeds: EmbedBuilder[] = [embed];
            if (chunks.length > 0) {
                embed.addFields({
                    name: `📋 Cases (1-${Math.min(chunks[0]!.split('\n\n').length, automodInfractions.length)})`,
                    value: chunks[0]!,
                    inline: false,
                });
            }

            if (chunks.length > 1) {
                for (let i = 1; i < chunks.length; i++) {
                    const chunkStart =
                        chunks
                            .slice(0, i + 1)
                            .join('\n\n')
                            .split('\n\n').length -
                        chunks[i]!.split('\n\n').length +
                        1;
                    const chunkEnd = chunks
                        .slice(0, i + 1)
                        .join('\n\n')
                        .split('\n\n').length;

                    const additionalEmbed = EmbedGenerator.basicEmbed()
                        .setTitle('🛡️ Automod Cases History (Continued)')
                        .addFields({
                            name: `📋 Cases (${chunkStart}-${Math.min(chunkEnd, automodInfractions.length)})`,
                            value: chunks[i]!,
                            inline: false,
                        })
                        .setColor('Blue')
                        .setTimestamp();

                    embeds.push(additionalEmbed);
                }
            }

            await interaction.editReply({ embeds });
        } catch (error) {
            console.error('Error fetching automod cases:', error);
            await interaction.editReply({
                embeds: [
                    EmbedGenerator.errorEmbed('An error occurred while fetching automod cases.'),
                ],
            });
        }
    },
};
