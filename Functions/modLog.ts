import Discord from 'discord.js';
import { GuildsManager } from '../Classes/GuildsManager.ts';

/**
 * Sends a log embed to the mod logs channel if logging is enabled.
 * @param {Discord.Guild} guild - The guild
 * @param {GuildsManager} dbGuild - The guild database document
 * @param {Discord.EmbedBuilder} embed - The embed to send
 * @param {Discord.AttachmentBuilder[]} [files] - Optional files to attach
 */
export async function sendModLog(
    guild: Discord.Guild,
    dbGuild: GuildsManager,
    embed: Discord.EmbedBuilder,
    files: Discord.AttachmentBuilder[] = []
): Promise<void> {
    if (!dbGuild?.logs?.enabled || !dbGuild.logs.moderator) return;

    const channel = await guild.channels.fetch(dbGuild.logs.moderator).catch(() => null);
    if (channel && channel instanceof Discord.TextChannel) {
        const payload: Discord.MessageCreateOptions = { embeds: [embed] };
        if (files.length > 0) payload.files = files;
        await channel.send(payload).catch((err) => console.error('Error sending mod log:', err));
    }
}
