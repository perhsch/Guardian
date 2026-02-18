const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { GuildsManager } = require('../../Classes/GuildsManager');
const { sendModLog } = require('../../Functions/modLog');
const { recordDeletion } = require('../../Functions/antiNukeTracking');

module.exports = {
    name: 'channelDelete',
    async execute(channel, client) {
        if (!channel.guild) return;
        const dbGuild = await GuildsManager.fetch(channel.guild.id);
        if (!dbGuild) return;

        const antiNuke = dbGuild.document?.automod?.antiNuke || {};
        if (!antiNuke.enabled) return;

        const maxChannels = antiNuke.maxChannelsPerMinute ?? 3;
        const action = antiNuke.action || 'ban';

        let executorId = null;
        try {
            const logs = await channel.guild.fetchAuditLogs({
                type: Discord.AuditLogEvent.ChannelDelete,
                limit: 10,
            });
            const entry = logs.entries.find(
                (e) => (e.target?.id ?? e.targetId) === channel.id
            );
            if (entry && entry.executor) {
                executorId = entry.executor.id;
            }
        } catch (err) {
            console.error('Error fetching audit logs for anti-nuke:', err);
            return;
        }

        if (!executorId) return;

        const executor = await channel.guild.members.fetch(executorId).catch(() => null);
        if (!executor) return;
        
        if (executor.id === client.user.id) {
            return;
        }

        const count = recordDeletion(channel.guild.id, executorId, 'channel');
        if (count >= maxChannels) {
            const reason = `Anti-Nuke: Deleted ${count} channels in 1 minute`;
            const actionText = action === 'ban' ? 'banned' : 'kicked';
            const dmEmbed = EmbedGenerator.basicEmbed(
                `**Automod Action: Anti-Nuke**\n\n` +
                `You have been ${actionText} from **${channel.guild.name}** by the automoderation system.\n\n` +
                `**Reason:** ${reason}\n` +
                `**System:** Anti Nuke Protection\n` +
                `**Action Taken:** ${action === 'ban' ? 'Ban' : 'Kick'}\n\n` +
                `Mass deletion of channels is not allowed and triggers automatic protection measures.`
            )
                .setColor('Red')
                .setTitle(`Automod: ${action === 'ban' ? 'Banned' : 'Kicked'}`)
                .setFooter({ text: `${channel.guild.name}`, iconURL: channel.guild.iconURL() })
                .setTimestamp();
            await executor.send({ embeds: [dmEmbed] }).catch(() => null);
            try {
                if (action === 'ban') {
                    await executor.ban({ reason, deleteMessageSeconds: 0 });
                } else {
                    await executor.kick(reason);
                }
                const logEmbed = EmbedGenerator.basicEmbed(
                    `**Anti Nuke Triggered**\n` +
                    `${executor} (${executor.user.tag}) was ${action === 'ban' ? 'banned' : 'kicked'}.\n` +
                    `**Reason:** Deleted ${count} channels within 1 minute.\n` +
                    `**Channel:** ${channel.name || 'Unknown'} (${channel.id})`
                )
                    .setColor('Red')
                    .setTitle('Automod: Anti Nuke')
                    .setThumbnail(executor.user.displayAvatarURL({ dynamic: true }));
                await sendModLog(channel.guild, dbGuild, logEmbed);
            } catch (err) {
                console.error('Anti-nuke action failed:', err);
                const errorEmbed = EmbedGenerator.basicEmbed(
                    `**Anti Nuke Action Failed**\n` +
                    `Failed to ${action} ${executor} (${executor.user.tag}) for deleting ${count} channels.\n` +
                    `**Error:** ${err.message || 'Unknown error'}`
                )
                    .setColor('Red')
                    .setTitle('Automod: Anti Nuke Error');
                await sendModLog(channel.guild, dbGuild, errorEmbed).catch(() => null);
            }
        }
    },
};
