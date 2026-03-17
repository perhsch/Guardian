import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDMPermission(false)
        .setDescription('Sends an invite of the bot to the user'),

    execute(_interaction: ChatInputCommandInteraction, _client: Client) {
        const embed = {
            title: '🤖 Invite Guardian Bot',
            description: 'Add Guardian to your server and enjoy powerful moderation and management features!',
            color: 0x5865F2,
            thumbnail: {
                url: _client.user?.displayAvatarURL({ size: 256 }) || undefined
            },
            fields: [
                {
                    name: '🔗 **Invite Link**',
                    value: `[**Click here to invite Guardian**](https://discord.com/oauth2/authorize?client_id=${_client.user?.id}&permissions=8&integration_type=0&scope=bot)`,
                    inline: false
                },
                {
                    name: '✨ **Key Features**',
                    value: '🛡️ Advanced Moderation\n🎯 Auto-moderation\n🎫 Ticket System\n💾 Backup & Restore\n📊 Server Analytics',
                    inline: true
                },
                {
                    name: '⚡ **Permissions**',
                    value: 'Administrator access required for full functionality',
                    inline: true
                }
            ],
            footer: {
                text: `Guardian Bot • Protecting ${_client.guilds.cache.size} servers`,
                iconURL: _client.user?.displayAvatarURL({ size: 64 }) || undefined
            },
            timestamp: new Date().toISOString()
        };

        return { embeds: [embed] };
    },
};
