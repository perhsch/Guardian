const Discord = require('discord.js');

/**
 * Sends a log embed to the mod logs channel if logging is enabled.
 * @param {Discord.Guild} guild - The guild
 * @param {import('../Classes/GuildsManager').GuildsManager} dbGuild - The guild database document
 * @param {Discord.EmbedBuilder} embed - The embed to send
 * @param {Discord.AttachmentBuilder[]} [files] - Optional files to attach
 */
async function sendModLog(guild, dbGuild, embed, files = []) {
    if (!dbGuild?.logs?.enabled || !dbGuild.logs.moderator) return;

    const channel = await guild.channels.fetch(dbGuild.logs.moderator).catch(() => null);
    if (channel && channel instanceof Discord.TextChannel) {
        const payload = { embeds: [embed] };
        if (files.length > 0) payload.files = files;
        await channel.send(payload).catch((err) => console.error('Error sending mod log:', err));
    }
}

module.exports = { sendModLog };
