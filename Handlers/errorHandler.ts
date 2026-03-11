import { EmbedBuilder } from 'discord.js';

const ERROR_WEBHOOK_URL = 'https://canary.discord.com/api/webhooks/1481136328627458130/nHwx_90d33US20nb6wMtleY-ZBx3BvnxuwsRQ9tcXYcsTUITxMoJHx7HNXPO55s7ELeb';

async function sendErrorToWebhook(error: Error, errorType: string): Promise<void> {
    try {
        const embed = new EmbedBuilder()
            .setTitle('🚨 Bot Error Occurred')
            .setColor(0xFF0000)
            .addFields(
                {
                    name: 'Error Type',
                    value: `\`${errorType}\``,
                    inline: true
                },
                {
                    name: 'Timestamp',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: true
                },
                {
                    name: 'Error Message',
                    value: `\`\`\`${error.message}\`\`\``,
                    inline: false
                }
            )
            .setTimestamp();

        if (error.stack) {
            const stackTrace = error.stack.length > 1000
                ? error.stack.substring(0, 1000) + '...'
                : error.stack;
            embed.addFields({
                name: 'Stack Trace',
                value: `\`\`\`${stackTrace}\`\`\``,
                inline: false
            });
        }

        const payload = {
            embeds: [embed.toJSON()],
            username: 'Guardian Error Logger',
            avatar_url: 'https://cdn.discordapp.com/attachments/1048758700984270918/1048758701648654396/banner.png'
        };

        const response = await fetch(ERROR_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Failed to send error to webhook:', response.statusText);
        }
    } catch (webhookError) {
        console.error('Failed to send error to webhook:', webhookError);
    }
}

export async function processErrorHandler() {
    process.on('unhandledRejection', async (err) => {
        console.error(err);
        await sendErrorToWebhook(err as Error, 'Unhandled Rejection');
    });

    process.on('uncaughtException', async (err) => {
        console.error(err);
        await sendErrorToWebhook(err as Error, 'Uncaught Exception');
    });
}
