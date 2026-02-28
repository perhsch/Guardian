const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

const Infractions = require('../../../Schemas/Infractions');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('vc')
        .setDMPermission(false)
        .setDescription('Voice channel moderation commands.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ModerateMembers)
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('The voice moderation action to perform.')
                .setRequired(true)
                .addChoices(
                    { name: '🔇 Mute', value: 'mute' },
                    { name: '🔊 Unmute', value: 'unmute' },
                    { name: '🔇 Deafen', value: 'deafen' },
                    { name: '🔊 Undeafen', value: 'undeafen' },
                    { name: '👢 Kick', value: 'kick' }
                )
        )
        .addUserOption((option) =>
            option.setName('user').setDescription('The user to moderate.').setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for the voice moderation action.')
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (!interaction.guild) {
            return {
                embeds: [EmbedGenerator.errorEmbed('This command can only be used in a server.')],
                ephemeral: true,
            };
        }

        const type = interaction.options.getString('type', true);
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        // Prevent self-moderation
        if (user.id === interaction.user.id) {
            return {
                embeds: [EmbedGenerator.errorEmbed('You cannot perform voice moderation actions on yourself.')],
                ephemeral: true,
            };
        }

        // Check if target is in a voice channel
        const member = await interaction.guild.members.fetch({ user: user.id }).catch(() => null);
        if (!member) {
            return {
                embeds: [EmbedGenerator.errorEmbed('That user is no longer in the server.')],
                ephemeral: true,
            };
        }

        if (!member.voice.channel) {
            return {
                embeds: [EmbedGenerator.errorEmbed('That user is not in a voice channel.')],
                ephemeral: true,
            };
        }

        // Check permissions hierarchy
        if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return {
                embeds: [EmbedGenerator.errorEmbed('You cannot perform voice moderation actions on someone with an equal or higher role.')],
                ephemeral: true,
            };
        }

        let success = false;
        let actionDescription = '';
        let logTitle = '';
        let logColor = 0x5865f2; // Discord blue

        try {
            switch (type) {
                case 'mute':
                    await member.voice.setMute(true, reason);
                    success = true;
                    actionDescription = `🔇 **Voice Muted** in ${member.voice.channel.toString()}`;
                    logTitle = '🔇 Member Voice Muted';
                    break;

                case 'unmute':
                    await member.voice.setMute(false, reason);
                    success = true;
                    actionDescription = `🔊 **Voice Unmuted** in ${member.voice.channel.toString()}`;
                    logTitle = '🔊 Member Voice Unmuted';
                    logColor = 0x57f287; // Green
                    break;

                case 'deafen':
                    await member.voice.setDeaf(true, reason);
                    success = true;
                    actionDescription = `🔇 **Voice Deafened** in ${member.voice.channel.toString()}`;
                    logTitle = '🔇 Member Voice Deafened';
                    break;

                case 'undeafen':
                    await member.voice.setDeaf(false, reason);
                    success = true;
                    actionDescription = `🔊 **Voice Undeafened** in ${member.voice.channel.toString()}`;
                    logTitle = '🔊 Member Voice Undeafened';
                    logColor = 0x57f287; // Green
                    break;

                case 'kick':
                    await member.voice.disconnect(reason);
                    success = true;
                    actionDescription = `👢 **Kicked from voice** ${member.voice.channel.toString()}`;
                    logTitle = '👢 Member Voice Kicked';
                    logColor = 0xed4245; // Red

                    // Log voice kick as infraction
                    await Infractions.create({
                        guild: interaction.guild.id,
                        user: member.id,
                        issuer: interaction.user.id,
                        type: 'voice_kick',
                        reason: reason,
                        active: false,
                    });
                    break;

                default:
                    return {
                        embeds: [EmbedGenerator.errorEmbed('Invalid action type.')],
                        ephemeral: true,
                    };
            }
        } catch (error) {
            console.error('Voice moderation error:', error);
            return {
                embeds: [EmbedGenerator.errorEmbed('Failed to perform voice moderation action. Check my permissions.')],
                ephemeral: true,
            };
        }

        if (!success) {
            return {
                embeds: [EmbedGenerator.errorEmbed('Failed to perform the voice moderation action.')],
                ephemeral: true,
            };
        }

        // Create moderation log embed
        const modEmbed = new Discord.EmbedBuilder()
            .setColor(logColor)
            .setTitle(logTitle)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setDescription(
                `>>> **Voice moderation action has been performed**\n\n**Case Information**\n• **Member**: ${member.user.toString()}\n• **Member Tag**: \`${member.user.tag}\`\n• **Member ID**: \`${member.id}\`\n• **Moderator**: ${interaction.user.toString()}\n• **Action**: ${type.charAt(0).toUpperCase() + type.slice(1)}\n• **Voice Channel**: ${member.voice.channel.toString()}\n• **Reason**: ${reason}`
            )
            .addFields(
                {
                    name: '🔍 Member Details',
                    value: `• **Joined Server**: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n• **Account Created**: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n• **Current Roles**: ${member.roles.cache
                            .map((r) => r)
                            .slice(0, 3)
                            .join(' ') || 'None'
                        }${member.roles.cache.size > 3 ? ` +${member.roles.cache.size - 3} more` : ''}`,
                    inline: true,
                },
                {
                    name: '🎤 Voice Details',
                    value: `• **Voice Channel**: ${member.voice.channel.toString()}\n• **Server Muted**: ${member.voice.serverMute ? '✅ Yes' : '❌ No'}\n• **Server Deafened**: ${member.voice.serverDeaf ? '✅ Yes' : '❌ No'}\n• **Self Muted**: ${member.voice.selfMute ? '✅ Yes' : '❌ No'}\n• **Self Deafened**: ${member.voice.selfDeaf ? '✅ Yes' : '❌ No'}`,
                    inline: true,
                }
            )
            .setFooter({
                text: `Guardian Moderation • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL(),
            })
            .setTimestamp();

        await sendModLog(interaction.guild, dbGuild, modEmbed);

        // Create response embed
        const responseEmbed = new Discord.EmbedBuilder()
            .setColor(logColor)
            .setTitle(`✅ Voice ${type.charAt(0).toUpperCase() + type.slice(1)} Successful`)
            .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
            .setDescription(
                `>>> **Voice moderation action completed successfully**\n\n**Action Summary**\n• **Member**: ${member.user.toString()}\n• **Action**: ${actionDescription}\n• **Reason**: ${reason}`
            )
            .addFields({
                name: '📋 Action Details',
                value: `• **Moderator**: ${interaction.user.toString()}\n• **Voice Channel**: ${member.voice.channel.toString()}\n• **Timestamp**: <t:${Math.floor(Date.now() / 1000)}:F>`,
                inline: false,
            })
            .setFooter({
                text: `Action by ${interaction.user.tag} • Guardian Moderation`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        return { embeds: [responseEmbed] };
    },
};
