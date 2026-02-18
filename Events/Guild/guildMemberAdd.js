const Discord = require('discord.js');
const moment = require('moment');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { setLockdown } = require('../../Functions/antiRaidLockdown');
const { sendModLog } = require('../../Functions/modLog');
const { recordJoin, getJoinCount, getRecentJoiners } = require('../../Functions/antiRaidTracking');
const Guilds = require('../../Schemas/Guilds');
const { GuildsManager } = require('../../Classes/GuildsManager');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const guild = await GuildsManager.fetch(member.guild.id);
        if (!guild) return;

        if (
            guild.antiraid.enabled &&
            guild.antiraid.joinAmount != null &&
            guild.antiraid.joinWithin != null &&
            guild.antiraid.action
        ) {
            const timeWindowMs = guild.antiraid.joinWithin * 1000;
            
            if (!guild.antiraid.raid) {
                recordJoin(member.guild.id, member.id, timeWindowMs);
                
                const joinCount = getJoinCount(member.guild.id, timeWindowMs);
                
                if (joinCount >= guild.antiraid.joinAmount) {
                    guild.document.antiraid.raid = true;
                    if (guild.antiraid.lockdown.enabled) {
                        guild.document.antiraid.lockdown.active = true;
                    }

                    await Guilds.findOneAndUpdate(
                        { guild: member.guild.id },
                        {
                            $set: {
                                'antiraid.raid': true,
                                'antiraid.lockdown.active': guild.antiraid.lockdown.enabled,
                            },
                        },
                        { new: true }
                    );

                    if (guild.antiraid.channel) {
                        try {
                            const channel = await member.guild.channels.fetch(guild.antiraid.channel);
                            if (channel && channel instanceof Discord.TextChannel) {
                                await channel.send({
                                    embeds: [
                                        EmbedGenerator.basicEmbed(
                                            `🔒 | Raid mode has been enabled!\n**${joinCount}** members joined within **${guild.antiraid.joinWithin}** seconds.${
                                                guild.antiraid.lockdown.enabled
                                                    ? '\n🔒 | This server has entered lockdown mode!'
                                                    : ''
                                            }`
                                        )
                                            .setColor('Red')
                                            .setTitle('Anti Raid: Raid Detected'),
                                    ],
                                });
                            }
                        } catch (err) {
                            console.error('Error sending raid alert:', err);
                        }
                    }

                    if (guild.antiraid.lockdown.enabled) {
                        await setLockdown(member.guild, true).catch((err) =>
                            console.error('Error setting lockdown:', err)
                        );
                    }

                    const recentJoiners = getRecentJoiners(member.guild.id, timeWindowMs);
                    const action = guild.antiraid.action;
                    let successCount = 0;
                    let failCount = 0;

                    for (const userId of recentJoiners) {
                        try {
                            const targetMember = await member.guild.members.fetch(userId).catch(() => null);
                            if (!targetMember || targetMember.id === client.user.id) continue;
                            
                            if (targetMember.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
                                continue;
                            }

                            const dmMessage = EmbedGenerator.basicEmbed(
                                `You have been ${action === 'ban' ? 'banned' : 'kicked'} from **${member.guild.name}**\nThis server is currently in raid mode, please try again later!`
                            );

                            if (action === 'kick') {
                                await targetMember.send({ embeds: [dmMessage] }).catch(() => null);
                                await targetMember.kick('Anti-Raid: Mass join detected').catch(() => null);
                                successCount++;
                            } else if (action === 'ban') {
                                await targetMember.send({ embeds: [dmMessage] }).catch(() => null);
                                await targetMember.ban({ reason: 'Anti-Raid: Mass join detected' }).catch(() => null);
                                successCount++;
                            }
                        } catch (err) {
                            failCount++;
                            console.error(`Error processing raid member ${userId}:`, err);
                        }
                    }

                    const logEmbed = EmbedGenerator.basicEmbed(
                        `**Anti Raid Triggered**\n` +
                            `**Joins:** ${joinCount} members joined within ${guild.antiraid.joinWithin}s\n` +
                            `**Action:** ${action === 'ban' ? 'Banned' : 'Kicked'} ${successCount} members\n` +
                            `**Lockdown:** ${guild.antiraid.lockdown.enabled ? 'Enabled' : 'Disabled'}` +
                            (failCount > 0 ? `\n**Failed:** ${failCount} actions failed` : '')
                    )
                        .setColor('Red')
                        .setTitle('Automod: Anti Raid');
                    await sendModLog(member.guild, guild, logEmbed);
                }
            } else {
                const action = guild.antiraid.action;
                try {
                    if (member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
                        return;
                    }

                    const dmMessage = EmbedGenerator.basicEmbed(
                        `You have been ${action === 'ban' ? 'banned' : 'kicked'} from **${member.guild.name}**\nThis server is currently in raid mode, please try again later!`
                    );

                    if (action === 'kick') {
                        await member.send({ embeds: [dmMessage] }).catch(() => null);
                        await member.kick('Anti-Raid: Server is in raid mode').catch(() => null);
                    } else if (action === 'ban') {
                        await member.send({ embeds: [dmMessage] }).catch(() => null);
                        await member.ban({ reason: 'Anti-Raid: Server is in raid mode' }).catch(() => null);
                    }
                } catch (err) {
                    console.error('Error processing raid mode member:', err);
                }
            }
        }

        if (guild.verification.enabled) {
            const role = await member.guild.roles.fetch(guild.verification.role);
            if (role && role instanceof Discord.Role) member.roles.add(role).catch(() => null);
        }

        let assignedRole;
        if (guild.autorole.enabled) {
            const role = await member.guild.roles.fetch(
                member.user.bot ? guild.autorole.bot : guild.autorole.member
            );
            if (!role || !(role instanceof Discord.Role)) {
                assignedRole = 'Failed to fetch role.';
            } else {
                await member.roles
                    .add(role)
                    .then(() => {
                        assignedRole = role.id;
                    })
                    .catch(() => {
                        assignedRole = 'Failed due to higher role hierarchy.';
                    });
            }
        } else {
            assignedRole = 'Not configured.';
        }

        if (guild.logs.enabled) {
            const logChannel = await member.guild.channels.fetch(guild.logs.basic);
            if (!logChannel || !(logChannel instanceof Discord.TextChannel)) return;

            let color = '#74e21e';
            let risk = 'Fairly Safe';

            const accountCreation = parseInt(member.user.createdTimestamp / 1000);
            const joiningTime = parseInt(member.joinedAt / 1000);

            const monthsAgo = moment().subtract(2, 'months').unix();
            const weeksAgo = moment().subtract(2, 'weeks').unix();
            const daysAgo = moment().subtract(2, 'days').unix();

            if (accountCreation >= monthsAgo) {
                color = '#e2bb1e';
                risk = 'Medium';
            }

            if (accountCreation >= weeksAgo) {
                color = '#e24d1e';
                risk = 'High';
            }

            if (accountCreation >= daysAgo) {
                color = '#e21e11';
                risk = 'Extreme';
            }

            const response = {
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor({
                            name: `${member.user.tag} | ${member.id}`,
                            iconURL: member.displayAvatarURL({ dynamic: true }),
                        })
                        .setColor(color)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                        .setDescription(
                            [
                                `• User: ${member.user}`,
                                `• Account Type: ${member.user.bot ? 'Bot' : 'User'}`,
                                `• Role Assigned: <@&${assignedRole}>`,
                                `• Risk Level: ${risk}\n`,
                                `• Account Created: <t:${accountCreation}:D> | <t:${accountCreation}:R>`,
                                `• Account Joined: <t:${joiningTime}:D> | <t:${joiningTime}:R>`,
                            ].join('\n')
                        )
                        .setFooter({ text: 'Joined' })
                        .setTimestamp(),
                ],
            };

            if (risk === 'High' || risk === 'Extreme')
                response.components = [
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId(`MemberLogging-Kick-${member.id}`)
                            .setLabel('Kick')
                            .setStyle(Discord.ButtonStyle.Danger),
                        new Discord.ButtonBuilder()
                            .setCustomId(`MemberLogging-Ban-${member.id}`)
                            .setLabel('Ban')
                            .setStyle(Discord.ButtonStyle.Danger)
                    ),
                ];

            logChannel.send(response);
        }
    },
};
