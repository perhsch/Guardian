const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('privacy')
        .setDescription('View our privacy policy')
        .setDMPermission(true),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     */
    async execute(interaction, client) {
        const privacyEmbed = new Discord.EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('🔒 Guardian Bot Privacy Policy')
            .setDescription(
                'Your privacy is important to us. This policy explains what data we collect and how we use it.'
            )
            .addFields(
                {
                    name: '📊 Data Collection',
                    value: '• **User IDs**: For moderation and user management\n• **Guild IDs**: To store server-specific settings\n• **Moderation Data**: Infractions, bans, kicks with timestamps\n• **Message Content**: Only when necessary for moderation features\n• **Command Usage**: Anonymous usage statistics for improvement',
                    inline: false,
                },
                {
                    name: '🔐 Data Storage & Security',
                    value: '• All data is stored securely in MongoDB databases\n• Sensitive information is encrypted when possible\n• Database access is restricted and monitored\n• Regular backups are performed to prevent data loss',
                    inline: false,
                },
                {
                    name: '🎯 Data Usage',
                    value: '• **Moderation**: To enforce server rules and maintain safety\n• **Features**: To provide bot functionality and customization\n• **Analytics**: To improve performance and user experience\n• **Support**: To troubleshoot issues and provide assistance',
                    inline: false,
                },
                {
                    name: '👤 User Rights',
                    value: '• **Right to Access**: Request a copy of your data\n• **Right to Deletion**: Request removal of your personal data\n• **Right to Correction**: Request correction of inaccurate data\n• **Right to Opt-out**: Disable data collection where possible',
                    inline: false,
                },
                {
                    name: '🤝 Data Sharing',
                    value: '• We **never sell** your personal data to third parties\n• Data is only shared with trusted service providers (MongoDB)\n• Law enforcement requests are handled according to legal requirements\n• No data is shared with advertisers or marketing companies',
                    inline: false,
                },
                {
                    name: '⏰ Data Retention',
                    value: '• **Active Data**: Kept as long as necessary for service provision\n• **Moderation Logs**: Typically retained for 6-12 months\n• **Inactive Server Data**: Removed after 12 months of inactivity\n• **User Data**: Deleted upon account deletion or request',
                    inline: false,
                },
                {
                    name: '🔧 Cookies & Tracking',
                    value: '• We do not use tracking cookies or pixels\n• Web dashboard may use essential cookies for functionality\n• No third-party analytics or tracking services are used\n• All tracking is opt-in and transparent',
                    inline: false,
                },
                {
                    name: '📧 Contact & Questions',
                    value: '• **Support Server**: [Join our Discord](https://discord.gg/5nWZ8BJae4)\n• **GitHub**: [View our source code](https://github.com/Guardians-Stuff/Guardian)\n• **Data Requests**: Contact server administrators or join our support server\n• **Policy Updates**: Changes will be announced in our support server',
                    inline: false,
                },
                {
                    name: '📅 Last Updated',
                    value: 'February 19, 2026\n\n*This policy may be updated periodically. Continued use of the bot constitutes acceptance of any changes.*',
                    inline: false,
                }
            )
            .setFooter({
                text: 'Guardian Bot • Protecting your privacy',
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setTimestamp();

        const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(Discord.ButtonStyle.Link)
                .setURL('https://discord.gg/5nWZ8BJae4'),
            new Discord.ButtonBuilder()
                .setLabel('GitHub')
                .setStyle(Discord.ButtonStyle.Link)
                .setURL('https://github.com/Guardians-Stuff/Guardian')
        );

        return {
            embeds: [privacyEmbed],
            components: [row],
            ephemeral: true,
        };
    },
};
