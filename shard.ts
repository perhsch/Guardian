import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { ShardingManager } from 'discord.js';
import chalk from 'chalk';

const manager = new ShardingManager('./index.ts', {
    totalShards: 'auto',
    token: process.env['DISCORD_TOKEN'],
    execArgv: ['--import', 'tsx'],
});

console.log(chalk.blue('🚀 Starting Guardian Bot with Sharding...'));

manager.on('shardCreate', (shard) => {
    console.log(chalk.yellow(`[SHARD ${shard.id}] Launching shard...`));

    shard.on('ready', () => {
        console.log(chalk.green(`[SHARD ${shard.id}] Shard ready!`));
    });

    shard.on('disconnect', () => {
        console.log(chalk.red(`[SHARD ${shard.id}] Shard disconnected`));
    });

    shard.on('reconnecting', () => {
        console.log(chalk.yellow(`[SHARD ${shard.id}] Shard reconnecting...`));
    });

    shard.on('spawn', () => {
        console.log(chalk.green(`[SHARD ${shard.id}] Spawned process`));
    });

    shard.on('death', () => {
        console.log(chalk.red(`[SHARD ${shard.id}] Process died`));
    });

    shard.on('error', (error) => {
        console.error(chalk.red(`[SHARD ${shard.id}] Error: ${error.message}`));
    });
});

manager
    .spawn()
    .then(() => {
        console.log(chalk.green('✅ All shards spawned successfully!'));
    })
    .catch((error) => {
        console.error(chalk.red('❌ Failed to spawn shards:'), error);
    });

export { manager };
