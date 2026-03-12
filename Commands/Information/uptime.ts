import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import { Timestamp } from '@sapphire/timestamp';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDMPermission(false)
        .setDescription('View detailed bot uptime and performance statistics.'),

    execute(_interaction: ChatInputCommandInteraction, client: Client) {
        const uptime = client.uptime ?? 0;
        const totalSeconds = Math.floor(uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.heapUsed / 1048576);
        const memoryTotal = Math.round(memoryUsage.heapTotal / 1048576);

        const nodeVersion = process.version;
        const discordJsVersion = '14.7.1';

        const uptimeEmbed = new EmbedBuilder()
            .setTitle('⚡ System Performance & Uptime')
            .setColor('#00ff88')
            .setThumbnail(client.user!.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '🕐 Uptime Duration',
                    value: `**${days}** days, **${hours}** hours, **${minutes}** minutes, **${seconds}** seconds\n\`${new Timestamp('L').display(uptime)}\``,
                    inline: false
                },
                {
                    name: '💾 Memory Usage',
                    value: `**Used:** ${memoryMB} MB\n**Total:** ${memoryTotal} MB\n**Percentage:** ${Math.round((memoryMB / memoryTotal) * 100)}%`,
                    inline: true
                },
                {
                    name: '🔧 System Info',
                    value: `**Node.js:** ${nodeVersion}\n**Discord.js:** v${discordJsVersion}\n**Process ID:** ${process.pid}`,
                    inline: true
                },
                {
                    name: '📊 Performance Stats',
                    value: `**API Latency:** ${client.ws.ping}ms\n**Ready Since:** ${client.readyAt?.toLocaleDateString()}\n**Guilds:** ${client.guilds.cache.size}`,
                    inline: true
                }
            )
            .setFooter({
                text: `${client.user!.tag} • System Monitoring`,
                iconURL: client.user!.displayAvatarURL()
            })
            .setTimestamp()
            .setColor('#00ff88');

        return {
            embeds: [uptimeEmbed],
            ephemeral: true,
        };
    },
};
