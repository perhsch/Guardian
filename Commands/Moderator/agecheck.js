const Discord = require('discord.js');
const ms = require('ms');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('agecheck')
        .setDescription('Check detailed information about a user including account age')
        .setDMPermission(false)
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
            option.setName('user').setDescription('The user to check').setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName('public')
                .setDescription('Show the result publicly (default: false)')
                .setRequired(false)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const targetUser = interaction.options.getUser('user');
        const public = interaction.options.getBoolean('public') ?? false;

        await interaction.deferReply({ ephemeral: !public });

        let targetMember;
        try {
            targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        } catch (error) {}

        const accountCreated = targetUser.createdAt;
        const accountAge = Date.now() - accountCreated.getTime();
        const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));

        let riskLevel = '🟢 Low';
        let riskColor = 0x00ff00;

        if (accountAgeDays < 1) {
            riskLevel = '🔴 Critical';
            riskColor = 0xff0000;
        } else if (accountAgeDays < 7) {
            riskLevel = '🟠 High';
            riskColor = 0xff9900;
        } else if (accountAgeDays < 30) {
            riskLevel = '🟡 Medium';
            riskColor = 0xffff00;
        }

        let joinedAt = 'Not in server';
        let joinAge = 'N/A';
        let joinPosition = 'N/A';

        if (targetMember) {
            joinedAt = targetMember.joinedAt;
            const serverJoinAge = Date.now() - joinedAt.getTime();
            const serverJoinDays = Math.floor(serverJoinAge / (1000 * 60 * 60 * 24));
            joinAge = `${serverJoinDays} days (${ms(serverJoinAge)})`;

            const sortedMembers = Array.from(
                interaction.guild.members.cache.sort((a, b) => a.joinedAt - b.joinedAt).values()
            );
            joinPosition = sortedMembers.findIndex((m) => m.id === targetMember.id) + 1;
        }

        const indicators = [];
        if (targetUser.bot) indicators.push('🤖 Bot Account');
        if (targetUser.discriminator === '0000') indicators.push('🏷️ Tagged User');
        if (targetUser.avatarURL() === null) indicators.push('🖼️ No Avatar');
        if (targetUser.username.includes('bot') || targetUser.username.includes('Bot')) {
            indicators.push('🤖 Bot-like Username');
        }

        const verificationBadges = [];
        if (targetUser.verified) verificationBadges.push('✅ Verified');
        if (targetUser.mfaEnabled) verificationBadges.push('🔒 2FA Enabled');

        const embed = EmbedGenerator.basicEmbed()
            .setTitle(`🔍 Age Check: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
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
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        if (targetMember) {
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

            const roles =
                targetMember.roles.cache
                    .filter((role) => role.id !== interaction.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .first(10)
                    .map((role) => role.toString())
                    .join(' ') || 'None';

            if (roles !== 'None') {
                embed.addFields({
                    name: '👥 Roles (Top 10)',
                    value: roles.length > 0 ? roles : 'None',
                    inline: false,
                });
            }

            const permissions = targetMember.permissions;
            const keyPermissions = [
                permissions.has(Discord.PermissionFlagsBits.Administrator)
                    ? '👑 Administrator'
                    : null,
                permissions.has(Discord.PermissionFlagsBits.ManageGuild)
                    ? '⚙️ Manage Server'
                    : null,
                permissions.has(Discord.PermissionFlagsBits.ManageChannels)
                    ? '📢 Manage Channels'
                    : null,
                permissions.has(Discord.PermissionFlagsBits.KickMembers) ? '👢 Kick Members' : null,
                permissions.has(Discord.PermissionFlagsBits.BanMembers) ? '🔨 Ban Members' : null,
                permissions.has(Discord.PermissionFlagsBits.ManageMessages)
                    ? '💬 Manage Messages'
                    : null,
            ].filter(Boolean);

            if (keyPermissions.length > 0) {
                embed.addFields({
                    name: '🔑 Key Permissions',
                    value: keyPermissions.join(' • '),
                    inline: false,
                });
            }
        }

        if (indicators.length > 0) {
            embed.addFields({
                name: '⚠️ Indicators',
                value: indicators.join(' • '),
                inline: false,
            });
        }

        if (verificationBadges.length > 0) {
            embed.addFields({
                name: '✅ Verification Status',
                value: verificationBadges.join(' • '),
                inline: false,
            });
        }

        if (accountAgeDays < 7) {
            embed.addFields({
                name: '⚠️ Security Warning',
                value: `This account is very new (${accountAgeDays} days old). Exercise caution when interacting with this user.`,
                inline: false,
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
