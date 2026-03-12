import Discord from 'discord.js';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import { GuildsManager } from '../../Classes/GuildsManager.ts';

export default {
    name: 'messageUpdate',
    /**
     * @param {Discord.Message | Discord.PartialMessage} oldMessage
     * @param {Discord.Message | Discord.PartialMessage} newMessage
     */
    async execute(
        oldMessage: Discord.Message | Discord.PartialMessage,
        newMessage: Discord.Message | Discord.PartialMessage
    ) {
        if (!newMessage.guild) return;

        let resolvedNew = newMessage;
        if (newMessage.partial) {
            resolvedNew = await newMessage.fetch().catch(() => newMessage);
        }
        if (resolvedNew.author?.bot) return;

        let resolvedOld = oldMessage;
        if (oldMessage.partial) {
            resolvedOld = await oldMessage.fetch().catch(() => oldMessage);
        }

        const oldContent = resolvedOld.content ?? null;
        const newContent = resolvedNew.content ?? null;
        if (oldContent === newContent) return;

        const guild = await GuildsManager.fetch(resolvedNew.guild.id);
        if (!guild?.logs.enabled || !guild.logs.basic_logs) return;

        const logChannel = await resolvedNew.guild.channels.fetch(guild.logs.basic_logs);
        if (!logChannel || !(logChannel instanceof Discord.TextChannel)) return;

        const author = resolvedNew.author
            ? `${resolvedNew.author} (${resolvedNew.author.id})`
            : 'Unknown';
        const channel = resolvedNew.channelId ? `<#${resolvedNew.channelId}>` : 'Unknown';

        logChannel.send({
            embeds: [
                EmbedGenerator.basicEmbed(
                    [
                        `• User: ${author}`,
                        `• Channel: ${channel}`,
                        `• Before: ${oldContent || '*Unknown (message was not cached)*'}`,
                        `• After: ${newContent || '*Unknown (message was not cached)*'}`,
                    ].join('\n')
                )
                    .setTitle('Message Edited')
                    .setURL(resolvedNew.url)
                    .setTimestamp(),
            ],
        });
    },
};
