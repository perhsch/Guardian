import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { ShardingManager, Client } from 'discord.js';
import chalk from 'chalk';

interface ShardMetrics {
    id: number;
    startTime: number;
    lastHeartbeat: number;
    restartCount: number;
    lastRestart: number;
    status: 'starting' | 'ready' | 'disconnected' | 'reconnecting' | 'dead' | 'error';
    memoryUsage?: NodeJS.MemoryUsage;
    guildCount?: number;
    userCount?: number;
    ping?: number;
}

class EnhancedShardingManager extends ShardingManager {
    public shardMetrics: Map<number, ShardMetrics> = new Map();
    public healthCheckInterval?: NodeJS.Timeout;
    public metricsInterval?: NodeJS.Timeout;
    private readonly MAX_RESTART_ATTEMPTS = 5;
    private readonly RESTART_DELAY = 5000;
    private readonly HEALTH_CHECK_INTERVAL = 30000;
    private readonly METRICS_INTERVAL = 60000;

    constructor(file: string, options: any) {
        super(file, options);
        this.setupEnhancedEventHandlers();
        this.startHealthChecks();
    }

    private setupEnhancedEventHandlers() {
        this.on('shardCreate', (shard) => {
            this.initializeShardMetrics(shard.id);
            
            console.log(chalk.yellow(`[SHARD ${shard.id}] Launching shard...`));

            shard.on('ready', () => {
                const metrics = this.shardMetrics.get(shard.id);
                if (metrics) {
                    metrics.status = 'ready';
                    metrics.lastHeartbeat = Date.now();
                }
                console.log(chalk.green(`[SHARD ${shard.id}] Shard ready!`));
                this.logShardStats(shard);
            });

            shard.on('disconnect', () => {
                const metrics = this.shardMetrics.get(shard.id);
                if (metrics) {
                    metrics.status = 'disconnected';
                }
                console.log(chalk.red(`[SHARD ${shard.id}] Shard disconnected`));
                this.handleShardDisconnect(shard);
            });

            shard.on('reconnecting', () => {
                const metrics = this.shardMetrics.get(shard.id);
                if (metrics) {
                    metrics.status = 'reconnecting';
                }
                console.log(chalk.yellow(`[SHARD ${shard.id}] Shard reconnecting...`));
            });

            shard.on('spawn', () => {
                console.log(chalk.green(`[SHARD ${shard.id}] Spawned process`));
            });

            shard.on('death', () => {
                const metrics = this.shardMetrics.get(shard.id);
                if (metrics) {
                    metrics.status = 'dead';
                }
                console.log(chalk.red(`[SHARD ${shard.id}] Process died`));
                this.handleShardDeath(shard);
            });

            shard.on('error', (error) => {
                const metrics = this.shardMetrics.get(shard.id);
                if (metrics) {
                    metrics.status = 'error';
                }
                console.error(chalk.red(`[SHARD ${shard.id}] Error: ${error.message}`));
                this.handleShardError(shard, error);
            });
        });
    }

    private initializeShardMetrics(shardId: number) {
        this.shardMetrics.set(shardId, {
            id: shardId,
            startTime: Date.now(),
            lastHeartbeat: Date.now(),
            restartCount: 0,
            lastRestart: 0,
            status: 'starting'
        });
    }

    private async handleShardDisconnect(shard: any) {
        setTimeout(async () => {
            const metrics = this.shardMetrics.get(shard.id);
            if (metrics && metrics.status === 'disconnected') {
                console.log(chalk.yellow(`[SHARD ${shard.id}] Attempting to respawn disconnected shard...`));
                try {
                    await shard.respawn();
                    metrics.restartCount++;
                    metrics.lastRestart = Date.now();
                } catch (error) {
                    console.error(chalk.red(`[SHARD ${shard.id}] Failed to respawn:`, error));
                }
            }
        }, this.RESTART_DELAY);
    }

    private async handleShardDeath(shard: any) {
        const metrics = this.shardMetrics.get(shard.id);
        if (metrics && metrics.restartCount < this.MAX_RESTART_ATTEMPTS) {
            console.log(chalk.yellow(`[SHARD ${shard.id}] Attempting to restart dead shard (Attempt ${metrics.restartCount + 1}/${this.MAX_RESTART_ATTEMPTS})...`));
            
            setTimeout(async () => {
                try {
                    await shard.respawn();
                    metrics.restartCount++;
                    metrics.lastRestart = Date.now();
                    metrics.status = 'starting';
                } catch (error) {
                    console.error(chalk.red(`[SHARD ${shard.id}] Failed to restart dead shard:`, error));
                }
            }, this.RESTART_DELAY * (metrics.restartCount + 1));
        } else {
            console.error(chalk.red(`[SHARD ${shard.id}] Max restart attempts reached. Shard will remain dead.`));
        }
    }

    private handleShardError(shard: any, error: Error) {
        console.error(chalk.red(`[SHARD ${shard.id}] Shard error details:`, {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }));
    }

    private startHealthChecks() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.HEALTH_CHECK_INTERVAL);

        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, this.METRICS_INTERVAL);
    }

    private async performHealthCheck() {
        const now = Date.now();
        for (const [shardId, metrics] of this.shardMetrics) {
            const timeSinceLastHeartbeat = now - metrics.lastHeartbeat;
            
            if (timeSinceLastHeartbeat > this.HEALTH_CHECK_INTERVAL * 2 && metrics.status === 'ready') {
                console.warn(chalk.yellow(`[SHARD ${shardId}] Health check failed - no heartbeat for ${timeSinceLastHeartbeat}ms`));
                metrics.status = 'disconnected';
            }
        }
    }

    private async collectMetrics() {
        try {
            const results = await this.broadcastEval((client: Client) => {
                return {
                    guildCount: client.guilds.cache.size,
                    userCount: client.users.cache.size,
                    ping: client.ws.ping,
                    memoryUsage: process.memoryUsage(),
                    uptime: client.uptime
                };
            });

            results.forEach((result, index) => {
                const metrics = this.shardMetrics.get(index);
                if (metrics && result) {
                    metrics.guildCount = result.guildCount;
                    metrics.userCount = result.userCount;
                    metrics.ping = result.ping;
                    metrics.memoryUsage = result.memoryUsage;
                }
            });

            this.logClusterMetrics();
        } catch (error) {
            console.error(chalk.red('Failed to collect shard metrics:'), error);
        }
    }

    private async logShardStats(shard: any) {
        try {
            const results = await shard.eval((client: Client) => {
                return {
                    guilds: client.guilds.cache.size,
                    users: client.users.cache.size,
                    channels: client.channels.cache.size,
                    ping: client.ws.ping,
                    uptime: client.uptime
                };
            });

            console.log(chalk.blue(`[SHARD ${shard.id}] Stats:`, {
                guilds: results?.guilds || 0,
                users: results?.users || 0,
                channels: results?.channels || 0,
                ping: `${results?.ping || 0}ms`,
                uptime: `${Math.floor((results?.uptime || 0) / 1000)}s`
            }));
        } catch (error) {
            console.error(chalk.red(`[SHARD ${shard.id}] Failed to get stats:`, error));
        }
    }

    private logClusterMetrics() {
        const totalGuilds = Array.from(this.shardMetrics.values()).reduce((sum, m) => sum + (m.guildCount || 0), 0);
        const totalUsers = Array.from(this.shardMetrics.values()).reduce((sum, m) => sum + (m.userCount || 0), 0);
        const avgPing = Array.from(this.shardMetrics.values()).reduce((sum, m) => sum + (m.ping || 0), 0) / this.shardMetrics.size;
        
        const activeShards = Array.from(this.shardMetrics.values()).filter(m => m.status === 'ready').length;
        
        console.log(chalk.cyan(`[CLUSTER] Metrics:`, {
            totalShards: this.shardMetrics.size,
            activeShards,
            totalGuilds,
            totalUsers,
            avgPing: `${Math.round(avgPing)}ms`,
            timestamp: new Date().toISOString()
        }));
    }

    public getShardHealth(): { [shardId: number]: ShardMetrics } {
        const health: { [shardId: number]: ShardMetrics } = {};
        this.shardMetrics.forEach((metrics, id) => {
            health[id] = { ...metrics };
        });
        return health;
    }

    public async restartShard(shardId: number): Promise<boolean> {
        try {
            const shard = this.shards.get(shardId);
            if (shard) {
                await shard.respawn();
                const metrics = this.shardMetrics.get(shardId);
                if (metrics) {
                    metrics.restartCount++;
                    metrics.lastRestart = Date.now();
                    metrics.status = 'starting';
                }
                console.log(chalk.green(`[SHARD ${shardId}] Manual restart successful`));
                return true;
            }
            return false;
        } catch (error) {
            console.error(chalk.red(`[SHARD ${shardId}] Manual restart failed:`), error);
            return false;
        }
    }

    public async broadcastToAll(event: string, ...args: any[]): Promise<any[]> {
        try {
            return await this.broadcastEval((client: Client) => {
                client.emit(event, ...args);
                return { shardId: client.shard?.ids[0] || 0, success: true };
            }, { context: { event, args } });
        } catch (error) {
            console.error(chalk.red('Failed to broadcast event to all shards:'), error);
            return [];
        }
    }

    public async sendToShard(shardId: number, event: string, ...args: any[]): Promise<boolean> {
        try {
            const result = await this.shards.get(shardId)?.eval((client: Client) => {
                client.emit(event, ...args);
                return { shardId: client.shard?.ids[0] || 0, success: true };
            }, { context: { event, args } });
            
            return result?.success || false;
        } catch (error) {
            console.error(chalk.red(`Failed to send event to shard ${shardId}:`), error);
            return false;
        }
    }

    public async getGlobalStats(): Promise<{
        totalGuilds: number;
        totalUsers: number;
        totalChannels: number;
        averagePing: number;
        totalMemory: number;
        activeShards: number;
        totalShards: number;
    }> {
        try {
            const results = await this.broadcastEval((client: Client) => ({
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                channels: client.channels.cache.size,
                ping: client.ws.ping,
                memory: process.memoryUsage().heapUsed,
                ready: client.isReady()
            }));

            const validResults = results.filter(r => r !== null);
            
            return {
                totalGuilds: validResults.reduce((sum, r) => sum + r.guilds, 0),
                totalUsers: validResults.reduce((sum, r) => sum + r.users, 0),
                totalChannels: validResults.reduce((sum, r) => sum + r.channels, 0),
                averagePing: validResults.reduce((sum, r) => sum + r.ping, 0) / validResults.length,
                totalMemory: validResults.reduce((sum, r) => sum + r.memory, 0),
                activeShards: validResults.filter(r => r.ready).length,
                totalShards: validResults.length
            };
        } catch (error) {
            console.error(chalk.red('Failed to get global stats:'), error);
            return {
                totalGuilds: 0,
                totalUsers: 0,
                totalChannels: 0,
                averagePing: 0,
                totalMemory: 0,
                activeShards: 0,
                totalShards: 0
            };
        }
    }

    public async findUserGuilds(userId: string): Promise<string[]> {
        try {
            const results = await this.broadcastEval((client: Client) => {
                const guilds = client.guilds.cache.filter(guild => guild.members.cache.has(userId));
                return guilds.map(guild => guild.id);
            });

            return results.flat();
        } catch (error) {
            console.error(chalk.red(`Failed to find guilds for user ${userId}:`), error);
            return [];
        }
    }

    public async broadcastMessage(content: string, channelId?: string): Promise<boolean> {
        try {
            const results = await this.broadcastEval((client: Client) => {
                if (channelId) {
                    const channel = client.channels.cache.get(channelId);
                    if (channel && channel.isTextBased() && 'send' in channel) {
                        return channel.send(content).then(() => true).catch(() => false);
                    }
                }
                return false;
            });

            return results.some((r: any) => r);
        } catch (error) {
            console.error(chalk.red('Failed to broadcast message:'), error);
            return false;
        }
    }

    public async evaluateOnAll<T>(script: (client: Client) => T): Promise<T[]> {
        try {
            const results = await this.broadcastEval(script);
            return results as T[];
        } catch (error) {
            console.error(chalk.red('Failed to evaluate on all shards:'), error);
            return [];
        }
    }

    public destroy() {
        if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
        if (this.metricsInterval) clearInterval(this.metricsInterval);
        this.shards.forEach(shard => shard.kill());
    }
}

const manager = new EnhancedShardingManager('./index.ts', {
    totalShards: 'auto',
    token: process.env['DISCORD_TOKEN'],
    execArgv: ['--import', 'tsx'],
});

console.log(chalk.blue('🚀 Starting Guardian Bot with Enhanced Sharding...'));

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down gracefully...'));
    manager.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down gracefully...'));
    manager.destroy();
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error(chalk.red('💥 Unhandled Promise Rejection:'), error);
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red('💥 Uncaught Exception:'), error);
    manager.destroy();
    process.exit(1);
});

manager
    .spawn()
    .then(() => {
        console.log(chalk.green('✅ All shards spawned successfully!'));
        console.log(chalk.blue(`📊 Cluster started with ${manager.totalShards === 'auto' ? 'auto' : manager.totalShards} shards`));
    })
    .catch((error) => {
        console.error(chalk.red('❌ Failed to spawn shards:'), error);
        process.exit(1);
    });

export { manager };
