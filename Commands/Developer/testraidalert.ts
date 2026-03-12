import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { broadcastRaidAlert } from '../../Functions/crossServerRaidAlert.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('testraidalert')
        .setDescription('Test the cross-server raid alert system (Bot owner or Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        if (!interaction.guild) return;

        await interaction.deferReply({ ephemeral: true });

        const DEVELOPER_ID = '1447738202600505407';
        let isAuthorized = interaction.user.id === DEVELOPER_ID;

        if (!isAuthorized) {
            try {
                const application = await client.application!.fetch();
                isAuthorized = interaction.user.id === (application.owner as any)?.id;
            } catch (error) {
                console.error('Error fetching application owner:', error);
            }
        }

        if (!isAuthorized) {
            isAuthorized = (interaction.member as GuildMember).permissions.has(
                PermissionFlagsBits.Administrator
            );
        }

        if (!isAuthorized) {
            return interaction.editReply({
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'This command is restricted to the developer, bot owner, or server administrators.'
                    ),
                ],
            });
        }

        try {
            const mockRaidData = {
                joinCount: 15,
                joinWithin: 30,
                action: 'ban',
                successCount: 12,
                failCount: 3,
                lockdown: true,
                isTest: true,
            };
            const mockRaiders = [
                { userId: '123456789012345678', timestamp: Date.now() },
                { userId: '234567890123456789', timestamp: Date.now() },
                { userId: '345678901234567890', timestamp: Date.now() },
            ];

            await broadcastRaidAlert(interaction.guild, client, mockRaidData, mockRaiders);

            const successEmbed = EmbedGenerator.basicEmbed('✅ Test raid alert sent successfully!')
                .setTitle('Cross-Server Raid Alert Test')
                .setColor('Green')
                .setDescription(
                    'A mock raid alert has been broadcast to all guilds with global logging enabled.'
                )
                .addFields(
                    {
                        name: 'Test Data',
                        value: '15 joins in 30 seconds\nAction: Ban\nLockdown: Enabled\n**TEST MODE**',
                        inline: true,
                    },
                    { name: 'Mock Raiders', value: '3 test users included', inline: true }
                )
                .setFooter({ text: 'This was only a test - no real raid occurred' });

            return interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error testing raid alert:', error);
            return interaction.editReply({
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'Failed to send test raid alert. Check console for details.'
                    ),
                ],
            });
        }
    },
};
