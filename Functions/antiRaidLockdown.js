const Discord = require('discord.js');

/**
 * Apply or remove a simple server-wide lockdown for @everyone.
 *
 * - When active, members with only @everyone will be unable to send messages
 *   in normal text/announcement channels.
 * - When deactivated, the SendMessages overwrite for @everyone is reset to
 *   inherit from the channel defaults (set to null).
 *
 * @param {Discord.Guild} guild
 * @param {boolean} active
 */
async function setLockdown(guild, active) {
    if (!guild || !guild.roles || !guild.channels) return;

    const everyoneRole = guild.roles.everyone;
    if (!everyoneRole) return;

    const textLikeChannels = guild.channels.cache.filter(
        (ch) =>
            ch &&
            (ch.type === Discord.ChannelType.GuildText ||
                ch.type === Discord.ChannelType.GuildAnnouncement)
    );

    for (const channel of textLikeChannels.values()) {
        await channel.permissionOverwrites
            .edit(everyoneRole, { SendMessages: active ? false : null })
            .catch(() => null);
    }
}

module.exports = {
    setLockdown,
};

