import { Client, ActivityType, Guild, EmbedBuilder, TextChannel } from 'discord.js';
import { loadCommands } from '../../Handlers/commandHandler.ts';
import { fetchAllMembers } from '../../Functions/memberTracking.ts';
import { getMaintenanceEnabled } from '../../Functions/maintenance.ts';
import { server } from '../../index.ts';

/**
 * Sends a startup notification to the specified channel
 * @param {Client} client
 */
async function sendStartupNotification(client: Client) {
    try {
        const channelId = '1471691901324361971';
        const channel = await client.channels.fetch(channelId).catch(() => null);

        if (!channel || !(channel instanceof TextChannel)) {
            console.log(`Could not find startup notification channel: ${channelId}`);
            return;
        }

        if (!client.user) {
            console.log('Client user is not available');
            return;
        }

        const totalMembers = client.guilds.cache.reduce((acc: number, guild: Guild) => acc + guild.memberCount, 0);
        const totalServers = client.guilds.cache.size;

        const startupEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🤖 Guardian Bot Online')
            .setDescription('**Guardian has successfully started and is now online!**')
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 Statistics',
                    value: [
                        `**Servers:** ${totalServers}`,
                        `**Total Members:** ${totalMembers.toLocaleString()}`,
                        `**Uptime:** <t:${Math.floor(Date.now() / 1000)}:R>`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚡ Status',
                    value: [
                        `**Status:** 🟢 Online`,
                        `**Version:** 1.7.0`,
                        `**Node.js:** ${process.version}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🛡️ Features Ready',
                    value: '• Auto-moderation systems active\n• Cross-server raid protection\n',
                    inline: false
                }
            )
            .setFooter({
                text: 'Guardian Bot • Advanced Protection System',
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        await channel.send({ embeds: [startupEmbed] });
        console.log(`Startup notification sent to channel: ${channelId}`);
    } catch (error) {
        console.error('Failed to send startup notification:', error);
    }
}

export default {
    name: 'clientReady',
    once: true,
    /**
     * @param {Client} client
     */
    async execute(client: any) {
        await loadCommands(client);
        await client.expiringDocumentsManager.infractions.init();
        await client.expiringDocumentsManager.giveaways.init();
        await client.expiringDocumentsManager.reminders.init();

        if (process.env['LIVE'] === 'true') {
            process.on('uncaughtException', async (e: any) => console.log(e.stack || 'Unknown Error'));
            process.on('unhandledRejection', async (e: any) =>
                console.log(e.stack || 'Unknown Rejection')
            );
        }

        server.listen(2054, () => console.log('The client is now ready.'));

        const maintenanceMode = getMaintenanceEnabled();
        if (maintenanceMode) {
            client.user.setPresence({
                activities: [{ name: 'In Maintenance', type: ActivityType.Watching }],
                status: 'dnd',
            });
            client.commands.forEach((command: any) => {
                if (command.data.name !== 'maintenance') command.enabled = false;
            });
            return;
        }

        const totalMembers = client.guilds.cache.reduce((acc: number, guild: Guild) => acc + guild.memberCount, 0);
        const statuses = [
            { name: `Serving ${client.guilds.cache.size} servers!`, type: ActivityType.Watching },
            { name: `${totalMembers} members!`, type: ActivityType.Watching },
            { name: `Guardian Bot • Securing Servers`, type: ActivityType.Playing },
            { name: `use /setup to get started!`, type: ActivityType.Playing },
            { name: `Guardian Bot • Made for your server!`, type: ActivityType.Playing },
            { name: `Join server for help!`, type: ActivityType.Watching },
        ];

        let statusIndex = 0;
        client.user.setPresence({
            activities: [statuses[statusIndex]],
            status: 'online',
        });

        setInterval(() => {
            statusIndex = (statusIndex + 1) % statuses.length;
            client.user.setPresence({
                activities: [statuses[statusIndex]],
                status: 'online',
            });
        }, 15000); // Rotate every 15 seconds

        await fetchAllMembers(client);

        // Send startup notification to specified channel
        await sendStartupNotification(client);
    },
};
