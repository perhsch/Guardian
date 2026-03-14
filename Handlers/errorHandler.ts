import { EmbedBuilder, Client } from 'discord.js';

const ERROR_CHANNEL_ID = '1471348003297300662';

let client: Client;

export function initializeErrorHandler(botClient: Client) {
    client = botClient;
}

async function sendErrorToChannel(error: Error, errorType: string): Promise<void> {
    try {
        if (!client) return;

        const errorChannel = await client.channels.fetch(ERROR_CHANNEL_ID).catch(() => null);

        if (!errorChannel || !errorChannel.isTextBased() || !('send' in errorChannel)) return;

        const embed = new EmbedBuilder()
            .setTitle('🚨 Bot Error Occurred')
            .setColor(0xff0000)
            .addFields(
                {
                    name: 'Error Type',
                    value: `\`${errorType}\``,
                    inline: true,
                },
                {
                    name: 'Timestamp',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: true,
                },
                {
                    name: 'Error Message',
                    value: `\`\`\`${error.message}\`\`\``,
                    inline: false,
                }
            )
            .setTimestamp();

        if (error.stack) {
            const stackTrace =
                error.stack.length > 1000 ? error.stack.substring(0, 1000) + '...' : error.stack;
            embed.addFields({
                name: 'Stack Trace',
                value: `\`\`\`${stackTrace}\`\`\``,
                inline: false,
            });
        }

        await errorChannel.send({ embeds: [embed] }).catch(() => null);
    } catch (channelError) {
        console.error('Failed to send error to channel:', channelError);
    }
}

export async function processErrorHandler() {
    process.on('unhandledRejection', async (err) => {
        // Filter out Discord permission errors from console logging
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (
            !errorMessage.includes('Missing Access') &&
            !errorMessage.includes('Missing Permissions') &&
            !errorMessage.includes('50013') && // Discord permission error code
            !errorMessage.includes('50001')
        ) {
            // Discord missing access error code
            console.error(err);
        }
        await sendErrorToChannel(err as Error, 'Unhandled Rejection');
    });

    process.on('uncaughtException', async (err) => {
        // Filter out Discord permission errors from console logging
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (
            !errorMessage.includes('Missing Access') &&
            !errorMessage.includes('Missing Permissions') &&
            !errorMessage.includes('50013') && // Discord permission error code
            !errorMessage.includes('50001')
        ) {
            // Discord missing access error code
            console.error(err);
        }
        await sendErrorToChannel(err as Error, 'Uncaught Exception');
    });
}
