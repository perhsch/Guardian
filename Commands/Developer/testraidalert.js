const Discord = require('discord.js');
const { broadcastRaidAlert } = require('../../Functions/crossServerRaidAlert');
const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('testraidalert')
        .setDescription('Test the cross-server raid alert system (Bot owner or Admin only)')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        await interaction.deferReply({ ephemeral: true });

        // Check if user is authorized (developer, bot owner, or has admin permissions)
        const DEVELOPER_ID = '1447738202600505407';
        let isAuthorized = interaction.user.id === DEVELOPER_ID;
        
        if (!isAuthorized) {
            try {
                // Try to get the application owner
                const application = await client.application.fetch();
                isAuthorized = interaction.user.id === application.owner?.id;
            } catch (error) {
                console.error('Error fetching application owner:', error);
            }
        }

        // Fallback: Check if user has administrator permissions in the guild
        if (!isAuthorized) {
            isAuthorized = interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator);
        }

        if (!isAuthorized) {
            return interaction.editReply({
                embeds: [EmbedGenerator.errorEmbed('This command is restricted to the developer, bot owner, or server administrators.')]
            });
        }

        try {
            // Create mock raid data with test indicator
            const mockRaidData = {
                joinCount: 15,
                joinWithin: 30,
                action: 'ban',
                successCount: 12,
                failCount: 3,
                lockdown: true,
                isTest: true // Add test indicator
            };

            const mockRaiders = [
                { userId: '123456789012345678', timestamp: Date.now() },
                { userId: '234567890123456789', timestamp: Date.now() },
                { userId: '345678901234567890', timestamp: Date.now() }
            ];

            // Broadcast the test alert
            await broadcastRaidAlert(interaction.guild, client, mockRaidData, mockRaiders);

            const successEmbed = EmbedGenerator.basicEmbed('✅ Test raid alert sent successfully!')
                .setTitle('Cross-Server Raid Alert Test')
                .setColor('Green')
                .setDescription('A mock raid alert has been broadcast to all guilds with global logging enabled.')
                .addFields(
                    { name: 'Test Data', value: `15 joins in 30 seconds\nAction: Ban\nLockdown: Enabled\n**TEST MODE**`, inline: true },
                    { name: 'Mock Raiders', value: '3 test users included', inline: true }
                )
                .setFooter({ text: 'This was only a test - no real raid occurred' });

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error testing raid alert:', error);
            await interaction.editReply({
                embeds: [EmbedGenerator.errorEmbed('Failed to send test raid alert. Check console for details.')]
            });
        }
    }
};
