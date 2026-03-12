import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('privacy')
        .setDescription('View our comprehensive privacy policy')
        .setDMPermission(true),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        const privacyEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🔒 Guardian Bot Privacy Policy')
            .setDescription(
                'Your privacy is our top priority. This policy outlines exactly what data we collect, why we collect it, and how we protect it.'
            )
            .setThumbnail(interaction.client.user!.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 **Data We Collect**',
                    value: '```prolog\n• User IDs & Usernames\n• Server (Guild) IDs & Names\n• Moderation Actions (bans, kicks, warns)\n• Command Usage Statistics\n• Message Content (moderation only)\n• Server Configuration Settings\n```',
                    inline: false
                },
                {
                    name: '🔐 **How We Protect Your Data**',
                    value: '```diff\n+ Encrypted database connections\n+ Restricted admin access only\n+ Regular security audits\n+ Secure MongoDB clusters\n+ No plaintext sensitive data\n+ Limited data retention periods\n```',
                    inline: false
                },
                {
                    name: '🎯 **Why We Use Your Data**',
                    value: '```css\n{ Moderation: "Enforce server rules safely" }\n{ Features: "Provide personalized bot experience" }\n{ Analytics: "Improve performance & reliability" }\n{ Support: "Troubleshoot issues effectively" }\n```',
                    inline: false
                },
                {
                    name: '👤 **Your Rights & Control**',
                    value: '🔹 **Data Access** - Request your personal data anytime\n🔹 **Data Deletion** - We remove your data on request\n🔹 **Data Correction** - Fix inaccurate information\n🔹 **Opt-Out Options** - Disable non-essential tracking\n🔹 **Export Options** - Download your server data',
                    inline: false
                },
                {
                    name: '🤝 **Data Sharing Policy**',
                    value: '❌ **Never sell** personal data to third parties\n✅ **Only share** with essential services (MongoDB)\n✅ **Legal compliance** for law enforcement requests\n❌ **No sharing** with advertisers or data brokers',
                    inline: false
                },
                {
                    name: '⏰ **Data Retention Schedule**',
                    value: '📅 **Active Data**: Kept as long as needed\n📅 **Moderation Logs**: 6-12 months\n📅 **Inactive Servers**: Removed after 12 months\n📅 **User Data**: Deleted on request\n📅 **Command Logs**: 30 days rolling window',
                    inline: false
                },
                {
                    name: '🍪 **Cookies & Tracking**',
                    value: '🚫 **No tracking pixels** or analytics cookies\n🚫 **No third-party** tracking services\n✅ **Essential cookies only** for dashboard functionality\n✅ **Full transparency** about all data collection',
                    inline: false
                },
                {
                    name: '� **Contact & Support**',
                    value: '💬 **Support Server**: [Join Discord](https://discord.gg/5nWZ8BJae4)\n🔍 **Source Code**: [View on GitHub](https://github.com/Guardians-Stuff/Guardian)\n📧 **Data Requests**: Contact server admins\n📢 **Policy Updates**: Announced in support server',
                    inline: false
                },
                {
                    name: '📅 **Policy Information**',
                    value: '🗓️ **Last Updated**: February 19, 2026\n🔄 **Update Frequency**: Reviewed quarterly\n⚖️ **Governing Law**: GDPR & CCPA compliant\n⚠️ **Acceptance**: Continued use = policy acceptance',
                    inline: false
                }
            )
            .setFooter({
                text: 'Guardian Bot • Your Privacy, Our Responsibility',
                iconURL: interaction.client.user!.displayAvatarURL(),
            })
            .setTimestamp();

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('🎮 Join Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/5nWZ8BJae4')
                .setEmoji('🎮'),
            new ButtonBuilder()
                .setLabel('📚 View Source Code')
                .setStyle(ButtonStyle.Link)
                .setURL('https://github.com/Guardians-Stuff/Guardian')
                .setEmoji('📚')
        );

        return { embeds: [privacyEmbed], components: [actionRow], ephemeral: true };
    },
};
