import Discord from 'discord.js';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import { GuildsManager } from '../../Classes/GuildsManager.ts';
import { sendModLog } from '../../Functions/modLog.ts';
import { recordDeletion } from '../../Functions/antiNukeTracking.ts';

export default {
    name: 'roleDelete',
    async execute(role: Discord.Role, client: Discord.Client) {
        if (!role.guild) return;
        const dbGuild = await GuildsManager.fetch(role.guild.id);
        if (!dbGuild) return;

        const antiNuke = dbGuild.document?.automod?.antiNuke || ({} as any);
        if (!antiNuke.enabled) return;

        const maxRoles = antiNuke.maxRolesPerMinute ?? 3;
        const action = antiNuke.action || 'ban';

        let executorId: string | null = null;
        try {
            const logs = await role.guild.fetchAuditLogs({
                type: Discord.AuditLogEvent.RoleDelete,
                limit: 10,
            });
            const entry = logs.entries.find(
                (e) => (e.target?.id ?? (e as any).targetId) === role.id
            );
            if (entry && entry.executor) {
                executorId = entry.executor.id;
            }
        } catch (err) {
            console.error('Error fetching audit logs for anti-nuke role:', err);
            return;
        }

        if (!executorId) return;

        const executor = await role.guild.members.fetch(executorId).catch(() => null);
        if (!executor) return;
        
        if (executor.id === client.user?.id) {
            return;
        }

        const count = recordDeletion(role.guild.id, executorId, 'role');
        if (count >= maxRoles) {
            const reason = `Anti-Nuke: Deleted ${count} roles in 1 minute`;
            const actionText = action === 'ban' ? 'banned' : 'kicked';
            const dmEmbed = EmbedGenerator.basicEmbed(
                `**Automod Action: Anti-Nuke**\n\n` +
                `You have been ${actionText} from **${role.guild.name}** by the automoderation system.\n\n` +
                `**Reason:** ${reason}\n` +
                `**System:** Anti Nuke Protection\n` +
                `**Action Taken:** ${action === 'ban' ? 'Ban' : 'Kick'}\n\n` +
                `Mass deletion of roles is not allowed and triggers automatic protection measures.`
            )
                .setColor(Discord.Colors.Red)
                .setTitle(`Automod: ${action === 'ban' ? 'Banned' : 'Kicked'}`)
                .setFooter({ text: `${role.guild.name}`, iconURL: role.guild.iconURL() || undefined })
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
                    `**Reason:** Deleted ${count} roles within 1 minute.\n` +
                    `**Role:** ${role.name || 'Unknown'} (${role.id})`
                )
                    .setColor(Discord.Colors.Red)
                    .setTitle('Automod: Anti Nuke')
                    .setThumbnail(executor.user.displayAvatarURL({ forceStatic: false }));
                await sendModLog(role.guild, dbGuild, logEmbed);
            } catch (err: any) {
                console.error('Anti-nuke role action failed:', err);
                const errorEmbed = EmbedGenerator.basicEmbed(
                    `**Anti Nuke Action Failed**\n` +
                    `Failed to ${action} ${executor} (${executor.user.tag}) for deleting ${count} roles.\n` +
                    `**Error:** ${err.message || 'Unknown error'}`
                )
                    .setColor(Discord.Colors.Red)
                    .setTitle('Automod: Anti Nuke Error');
                await sendModLog(role.guild, dbGuild, errorEmbed).catch(() => null);
            }
        }
    },
};
