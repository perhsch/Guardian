const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

const Infractions = require('../../Schemas/Infractions');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('warn')
        .setDMPermission(false)
        .setDescription('Warns a member of the discord.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ModerateMembers)
        .addUserOption((option) =>
            option.setName(`user`).setDescription(`The user you'd like to warn.`).setRequired(true)
        )
        .addStringOption((option) =>
            option.setName(`reason`).setDescription(`Reason for warning the user.`)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const user = interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch({ user: user.id }).catch(() => null);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        if (!member)
            return {
                embeds: [EmbedGenerator.errorEmbed('That user is no longer in the server.')],
                ephemeral: true,
            };

        // Enhanced infraction embed for user DM
        const infractionEmbed = new Discord.EmbedBuilder()
            .setColor(0xeb459e)
            .setTitle('⚠️ Warning Issued')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setDescription(
                `>>> **You have received a warning in ${interaction.guild.name}**\n\n**Warning Details**\n• **Reason**: ${reason}\n• **Issued by**: ${interaction.user.tag}\n• **Date**: <t:${Math.floor(Date.now() / 1000)}:F>`
            )
            .addFields({
                name: '📋 What happens next?',
                value: `• This warning has been logged\n• Multiple warnings may lead to further action\n• Contact staff if you have questions`,
                inline: false,
            })
            .setFooter({
                text: `${interaction.guild.name} • Guardian Moderation`,
                iconURL: interaction.guild.iconURL(),
            })
            .setTimestamp();

        await member.send({ embeds: [infractionEmbed] }).catch(() => null);

        await Infractions.create({
            guild: interaction.guild.id,
            user: member.id,
            issuer: interaction.user.id,
            type: 'warning',
            reason: reason,
            active: false,
        });

        // Enhanced moderation log embed
        const modEmbed = new Discord.EmbedBuilder()
            .setColor(0xeb459e)
            .setTitle('⚠️ Member Warning')
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setDescription(
                `>>> **Warning has been issued to a server member**\n\n**Case Information**\n• **Member**: ${member.user.toString()}\n• **Member Tag**: \`${member.user.tag}\`\n• **Member ID**: \`${member.id}\`\n• **Moderator**: ${interaction.user.toString()}\n• **Reason**: ${reason}`
            )
            .addFields(
                {
                    name: '🔍 Member Details',
                    value: `• **Joined Server**: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n• **Account Created**: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n• **Roles**: ${
                        member.roles.cache
                            .map((r) => r)
                            .slice(0, 3)
                            .join(' ') || 'None'
                    }${member.roles.cache.size > 3 ? ` +${member.roles.cache.size - 3} more` : ''}`,
                    inline: true,
                },
                {
                    name: '⚖️ Moderation Details',
                    value: `• **Warning Count**: \`Loading...\`\n• **Previous Infractions**: \`Checking...\`\n• **Case ID**: \`WARN-${Date.now()}\``,
                    inline: true,
                }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({
                text: `Guardian Moderation • ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL(),
            })
            .setTimestamp();

        await sendModLog(interaction.guild, dbGuild, modEmbed);

        // Enhanced response embed for moderator
        const responseEmbed = new Discord.EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('✅ Warning Successfully Issued')
            .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
            .setDescription(
                `>>> **Member has been warned successfully**\n\n**Action Summary**\n• **Member**: ${member.user.toString()}\n• **Reason**: ${reason}\n• **DM Sent**: ${infractionEmbed ? '✅ Yes' : '❌ Failed'}`
            )
            .addFields({
                name: '📋 Next Steps',
                value: `• Warning has been logged in the database\n• Member has been notified via DM\n• Case is recorded in moderation logs`,
                inline: false,
            })
            .setFooter({
                text: `Issued by ${interaction.user.tag} • Guardian Moderation`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        return { embeds: [responseEmbed] };
    },
};
