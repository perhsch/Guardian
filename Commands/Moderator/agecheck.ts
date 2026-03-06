import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    GuildMember
} from 'discord.js';
import ms from 'ms';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('agecheck')
        .setDescription('Check detailed information about a user including account age')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
            option.setName('user').setDescription('The user to check').setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName('public')
                .setDescription('Show the result publicly (default: false)')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const targetUser = interaction.options.getUser('user', true);
        const isPublic = interaction.options.getBoolean('public') ?? false;

        await interaction.deferReply({ ephemeral: !isPublic });

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const accountCreated = targetUser.createdAt;
        const accountAge = Date.now() - accountCreated.getTime();
        const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));

        let riskLevel = '🟢 Low';
        let riskColor = 0x00ff00;
        if (accountAgeDays < 1) { riskLevel = '🔴 Critical'; riskColor = 0xff0000; }
        else if (accountAgeDays < 7) { riskLevel = '🟠 High'; riskColor = 0xff9900; }
        else if (accountAgeDays < 30) { riskLevel = '🟡 Medium'; riskColor = 0xffff00; }

        let joinAge = 'N/A';
        let joinPosition: string | number = 'N/A';
        let joinedAt: Date | null = null;

        if (targetMember?.joinedAt) {
            joinedAt = targetMember.joinedAt;
            const serverJoinAge = Date.now() - joinedAt.getTime();
            const serverJoinDays = Math.floor(serverJoinAge / (1000 * 60 * 60 * 24));
            joinAge = `${serverJoinDays} days (${ms(serverJoinAge)})`;

            const sortedMembers = Array.from(
                interaction.guild.members.cache.sort((a, b) => (a.joinedTimestamp ?? 0) - (b.joinedTimestamp ?? 0)).values()
            );
            joinPosition = sortedMembers.findIndex((m) => m.id === targetMember.id) + 1;
        }

        const indicators: string[] = [];
        if (targetUser.bot) indicators.push('🤖 Bot Account');
        if (!targetUser.avatarURL()) indicators.push('🖼️ No Avatar');
        if (targetUser.username.toLowerCase().includes('bot')) indicators.push('🤖 Bot-like Username');

        const embed = EmbedGenerator.basicEmbed()
            .setTitle(`🔍 Age Check: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
            .setColor(riskColor)
            .addFields(
                {
                    name: '📋 User Information',
                    value: [
                        `**Username:** ${targetUser.username}`,
                        `**Display Name:** ${targetMember?.nickname || targetUser.displayName}`,
                        `**User ID:** ${targetUser.id}`,
                        `**Tag:** ${targetUser.tag}`,
                        `**Type:** ${targetUser.bot ? 'Bot' : 'User'}`,
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '📅 Account Age',
                    value: [
                        `**Created:** <t:${Math.floor(accountCreated.getTime() / 1000)}:F>`,
                        `**Age:** ${accountAgeDays} days (${ms(accountAge)})`,
                        `**Risk Level:** ${riskLevel}`,
                    ].join('\n'),
                    inline: false,
                }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        if (targetMember && joinedAt) {
            embed.addFields({
                name: '🏠 Server Information',
                value: [
                    `**Joined:** <t:${Math.floor(joinedAt.getTime() / 1000)}:F>`,
                    `**Time in Server:** ${joinAge}`,
                    `**Join Position:** #${joinPosition}`,
                    `**Roles:** ${targetMember.roles.cache.size - 1} roles`,
                ].join('\n'),
                inline: false,
            });

            const roles = targetMember.roles.cache
                .filter((role) => role.id !== interaction.guild!.id)
                .sort((a, b) => b.position - a.position)
                .first(10)
                .map((role) => role.toString())
                .join(' ') || 'None';

            if (roles !== 'None') {
                embed.addFields({ name: '👥 Roles (Top 10)', value: roles, inline: false });
            }

            const permissions = targetMember.permissions;
            const keyPermissions = [
                permissions.has(PermissionFlagsBits.Administrator) ? '👑 Administrator' : null,
                permissions.has(PermissionFlagsBits.ManageGuild) ? '⚙️ Manage Server' : null,
                permissions.has(PermissionFlagsBits.ManageChannels) ? '📢 Manage Channels' : null,
                permissions.has(PermissionFlagsBits.KickMembers) ? '👢 Kick Members' : null,
                permissions.has(PermissionFlagsBits.BanMembers) ? '🔨 Ban Members' : null,
                permissions.has(PermissionFlagsBits.ManageMessages) ? '💬 Manage Messages' : null,
            ].filter(Boolean) as string[];

            if (keyPermissions.length > 0) {
                embed.addFields({ name: '🔑 Key Permissions', value: keyPermissions.join(' • '), inline: false });
            }
        }

        if (indicators.length > 0) embed.addFields({ name: '⚠️ Indicators', value: indicators.join(' • '), inline: false });
        if (accountAgeDays < 7) {
            embed.addFields({ name: '⚠️ Security Warning', value: `This account is very new (${accountAgeDays} days old). Exercise caution when interacting with this user.`, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
