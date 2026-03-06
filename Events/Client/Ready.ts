import Discord, { ActivityType } from 'discord.js';
import { loadCommands } from '../../Handlers/commandHandler.ts';
import { fetchAllMembers } from '../../Functions/memberTracking.ts';
import { getMaintenanceEnabled } from '../../Functions/maintenance.ts';
import { server } from '../../index.ts';

export default {
    name: 'clientReady',
    once: true,
    /**
     * @param {Discord.Client} client
     */
    async execute(client: any) {
        await loadCommands(client);
        await client.expiringDocumentsManager.infractions.init();
        await client.expiringDocumentsManager.giveaways.init();
        await client.expiringDocumentsManager.reminders.init();

        if (process.env.LIVE === 'true') {
            process.on('uncaughtException', async (e: any) => console.log(e.stack || 'Unknown Error'));
            process.on('unhandledRejection', async (e: any) =>
                console.log(e.stack || 'Unknown Rejection')
            );
        }

        server.listen(2053, () => console.log('The client is now ready.'));

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

        const totalMembers = client.guilds.cache.reduce((acc: number, guild: Discord.Guild) => acc + guild.memberCount, 0);
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
    },
};
