import { Client } from 'discord.js';
import * as Statcord from 'statcord.js';
import * as os from 'os';

export class StatcordManager {
    private client: Client;
    private statcord: any;

    constructor(client: Client) {
        this.client = client;
        this.statcord = null;
    }

    private async initializeStatcord(): Promise<void> {
        const apiKey = process.env['STATCORD_API_KEY'];

        if (!apiKey) {
            // console.error('STATCORD_API_KEY not found in environment variables');
            throw new Error('STATCORD_API_KEY is required');
        }

        if (!this.client.user) {
            // console.error('Client user is not available for Statcord initialization');
            return;
        }

        // console.log('Initializing Statcord with API key:', apiKey);
        // console.log('Bot client ID:', this.client.user.id);

        // Try different initialization methods
        try {
            this.statcord = new (Statcord as any).Client(apiKey, this.client);
        } catch (error) {
            // console.log('Trying alternative Statcord initialization...');
            this.statcord = new (Statcord as any).Client({
                key: apiKey,
                client: this.client,
            });
        }
    }

    async start(): Promise<void> {
        try {
            // Wait a bit for client to be fully ready
            await new Promise((resolve) => setTimeout(resolve, 2000));

            await this.initializeStatcord();

            // console.log('Starting Statcord with API key:', process.env['STATCORD_API_KEY'] || 'statcord.com-SC-8479334b4c8f4be39ba050687');

            // Post initial stats
            await this.postStats();

            // Set up automatic posting every 30 minutes
            setInterval(
                async () => {
                    await this.postStats();
                },
                30 * 60 * 1000
            );

            // console.log('Statcord integration started successfully');
        } catch (error) {
            // console.error('Failed to start Statcord:', error);
            // console.error('Error details:', JSON.stringify(error, null, 2));
        }
    }

    async postStats(): Promise<void> {
        try {
            if (!this.client.user || !this.client.guilds.cache.size) {
                // console.log('Client or guilds not ready, skipping stats post');
                return;
            }

            const stats = {
                servers: this.client.guilds.cache.size,
                users: this.client.users.cache.size,
                members: this.client.guilds.cache.reduce(
                    (acc, guild) => acc + guild.memberCount,
                    0
                ),
                channels: this.client.guilds.cache.reduce(
                    (acc, guild) => acc + guild.channels.cache.size,
                    0
                ),
                shards: this.client.ws?.shards?.size || 0,
                voice: 0, // You can add voice connections later if needed
                playing: this.client.user.presence?.activities?.[0]?.name || 'Guardian Bot',
                uptime: process.uptime(),
                memory: {
                    total: os.totalmem(),
                    used: os.totalmem() - os.freemem(),
                    percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
                },
            };

            //console.log('Posting stats to Statcord:', JSON.stringify(stats, null, 2));

            // Try different method names
            try {
                await this.statcord.postStats(stats);
            } catch (error) {
                // console.log('Trying post method...');
                await this.statcord.post(stats);
            }

            // console.log(`Statcord stats posted! Servers: ${stats.servers}, Users: ${stats.users}`);
        } catch (error) {
            // console.error('Failed to post stats to Statcord:', error);
            // console.error('Post error details:', JSON.stringify(error, null, 2));
        }
    }

    async stop(): Promise<void> {
        try {
            await this.statcord.postStats({
                servers: 0,
                users: 0,
                members: 0,
                channels: 0,
                shards: 0,
                voice: 0,
                playing: 'Offline',
                uptime: 0,
                memory: { total: 0, used: 0, percentage: 0 },
            });
            // console.log('Statcord stopped');
        } catch (error) {
            // console.error('Failed to stop Statcord:', error);
        }
    }
}
