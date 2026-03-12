import Discord from 'discord.js';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import { GuildsManager } from '../../Classes/GuildsManager.ts';

export default {
    name: 'messageDelete',
    /**
     * @param {Discord.Message | Discord.PartialMessage} message
     */
    async execute(message: Discord.Message | Discord.PartialMessage) {
        if (!message.guild) return;

        let resolvedMessage = message;
        if (message.partial) {
            resolvedMessage = await message.fetch().catch(() => message);
        }

        if (resolvedMessage.author?.bot) return;

        const guild = await GuildsManager.fetch(resolvedMessage.guild.id);
        if (!guild?.logs.enabled || !guild.logs.basic_logs) return;

        const logChannel = await resolvedMessage.guild.channels.fetch(guild.logs.basic_logs);
        if (!logChannel || !(logChannel instanceof Discord.TextChannel)) return;

        const author = resolvedMessage.author
            ? `${resolvedMessage.author} (${resolvedMessage.author.id})`
            : 'Unknown';
        const channel = resolvedMessage.channelId ? `<#${resolvedMessage.channelId}>` : 'Unknown';
        const content = resolvedMessage.content || '*Unknown (message was not cached)*';

        logChannel.send({
            embeds: [
                EmbedGenerator.basicEmbed(
                    [`• User: ${author}`, `• Channel: ${channel}`, `• Content: ${content}`].join(
                        '\n'
                    )
                )
                    .setTitle('Message Deleted')
                    .setTimestamp(),
            ],
        });
    },
};
