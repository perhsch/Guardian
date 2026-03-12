import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    AuditLogEvent,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('audit')
        .setDMPermission(false)
        .setDescription('Displays the audit log for the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
        .addStringOption((option) =>
            option.setName('type').setDescription('The type of audit log to display').addChoices(
                { name: 'ban', value: AuditLogEvent.MemberBanAdd.toString() },
                { name: 'unban', value: AuditLogEvent.MemberBanRemove.toString() },
                { name: 'kick', value: AuditLogEvent.MemberKick.toString() },
                { name: 'message-delete', value: AuditLogEvent.MessageDelete.toString() },
                {
                    name: 'message-delete-bulk',
                    value: AuditLogEvent.MessageBulkDelete.toString(),
                },
                { name: 'role-create', value: AuditLogEvent.RoleCreate.toString() },
                { name: 'role-delete', value: AuditLogEvent.RoleDelete.toString() },
                { name: 'role-update', value: AuditLogEvent.RoleUpdate.toString() },
                { name: 'channel-create', value: AuditLogEvent.ChannelCreate.toString() },
                { name: 'channel-delete', value: AuditLogEvent.ChannelDelete.toString() },
                { name: 'channel-update', value: AuditLogEvent.ChannelUpdate.toString() },
                { name: 'emoji-create', value: AuditLogEvent.EmojiCreate.toString() },
                { name: 'emoji-delete', value: AuditLogEvent.EmojiDelete.toString() },
                { name: 'emoji-update', value: AuditLogEvent.EmojiUpdate.toString() },
                { name: 'invite-create', value: AuditLogEvent.InviteCreate.toString() },
                { name: 'invite-delete', value: AuditLogEvent.InviteDelete.toString() },
                { name: 'webhook-create', value: AuditLogEvent.WebhookCreate.toString() },
                { name: 'webhook-delete', value: AuditLogEvent.WebhookDelete.toString() },
                { name: 'webhook-update', value: AuditLogEvent.WebhookUpdate.toString() },
                { name: 'member-update', value: AuditLogEvent.MemberUpdate.toString() },
                { name: 'member-move', value: AuditLogEvent.MemberMove.toString() }
            )
        )
        .addUserOption((option) =>
            option.setName('user').setDescription('The user to filter the audit log for')
        )
        .addIntegerOption((option) =>
            option
                .setName('limit')
                .setDescription('The amount of audit logs to display')
                .setMaxValue(5)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const typeStr = interaction.options.getString('type');
        const user = interaction.options.getUser('user');
        const limit = interaction.options.getInteger('limit') || 5;

        const auditLogs = await interaction.guild.fetchAuditLogs({
            limit,
            type: typeStr ? (parseInt(typeStr) as AuditLogEvent) : undefined,
            user: user ?? undefined,
        } as any);

        if (auditLogs.entries.size === 0) {
            return { embeds: [EmbedGenerator.errorEmbed('No audit logs found!')], ephemeral: true };
        }

        const description: string[] = [];
        for (const entry of auditLogs.entries.values()) {
            const target = entry.target as any;
            description.push(
                `**${AuditLogEvent[entry.action]}** | <@${entry.executor?.id}>${target?.id ? ` => <@${target.id}>` : ''}`
            );
        }

        return {
            embeds: [
                EmbedGenerator.basicEmbed(description.join('\n'))
                    .setAuthor({ name: 'Audit Logs' })
                    .setTimestamp(),
            ],
        };
    },
};
