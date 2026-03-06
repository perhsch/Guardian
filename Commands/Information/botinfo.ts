import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import Discord from 'discord.js';
import Mongoose from 'mongoose';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Receive information about the bot')
        .setDMPermission(false),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);

        const totalUsers = interaction.client.guilds.cache.reduce(
            (acc, guild) => acc + guild.memberCount,
            0
        );

        const totalChannels = interaction.client.channels.cache.size;
        const totalEmojis = interaction.client.emojis.cache.size;

        const replyEmbed = new EmbedBuilder()
            .setTitle('🤖 Guardian Bot Information')
            .setDescription('**Advanced Discord moderation & management bot**')
            .setThumbnail(interaction.client.user!.displayAvatarURL({ size: 256 }))
            .setColor('#7289DA')
            .addFields(
                {
                    name: '📊 **Statistics**',
                    value: `\`\`\`🌐 Guilds: ${interaction.client.guilds.cache.size}\n👥 Users: ${totalUsers.toLocaleString()}\n💬 Channels: ${totalChannels.toLocaleString()}\n😀 Emojis: ${totalEmojis}\`\`\``,
                    inline: false,
                },
                {
                    name: '🔧 **System Information**',
                    value: `\`\`\`🔧 Node.js: v${process.version}\n📦 Discord.js: v${Discord.version}\n🗄️ Mongoose: v${Mongoose.version}\n💾 Memory: ${memoryMB}MB / ${memoryTotal}MB\`\`\``,
                    inline: false,
                },
                {
                    name: '⏰ **Uptime**',
                    value: `\`\`\`${days}d ${hours}h ${minutes}m ${seconds}s\`\`\``,
                    inline: true,
                },
                {
                    name: '🔗 **Links**',
                    value: `[**Github**](https://github.com/Guardians-Stuff/Guardian) | [**Invite**](https://discord.com/oauth2/authorize?client_id=1130480504097996832&scope=bot)`,
                    inline: true,
                },
                {
                    name: '👨‍💻 **Developers**',
                    value: "`Brennan's Development`",
                    inline: true,
                },
                {
                    name: '🔑 **Bot ID**',
                    value: `\`${interaction.client.user!.id}\``,
                    inline: true,
                }
            )
            .setFooter({
                text: 'Guardian Bot • Advanced Protection & Moderation',
                iconURL: interaction.client.user!.displayAvatarURL(),
            })
            .setTimestamp();

        return interaction.reply({ embeds: [replyEmbed] });
    },
};
