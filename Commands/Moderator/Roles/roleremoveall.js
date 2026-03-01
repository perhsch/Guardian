const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('roleremoveall')
        .setDescription('Removes a specified role from all members in the server.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription('The role to remove from all members.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('The reason for removing the role from everyone.')
                .setRequired(false)
        ),
    async execute(interaction, client, dbGuild) {
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return await interaction.reply({
                content: '❌ I cannot remove a role that is higher than or equal to my highest role.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const members = interaction.guild.members.cache.filter(member => member.roles.cache.has(role.id));
        let successCount = 0;
        let failCount = 0;

        for (const member of members.values()) {
            try {
                await member.roles.remove(role);
                successCount++;
            } catch (error) {
                failCount++;
                console.error(`Failed to remove role from ${member.user.tag}:`, error);
            }
        }

        const logEmbed = EmbedGenerator.basicEmbed([
            `**Action:** Mass Role Removed`,
            `**Moderator:** ${interaction.user.tag}`,
            `**Role:** ${role.name} (${role.id})`,
            `**Members affected:** ${successCount}`,
            `**Failed:** ${failCount}`,
            `**Reason:** ${reason}`
        ].join('\n')).setTitle('🔸 Mass Role Management');

        await sendModLog(interaction.guild, dbGuild, logEmbed);

        const embed = EmbedGenerator.basicEmbed([
            `✅ Successfully removed **${role.name}** from **${successCount}** members`,
            failCount > 0 ? `❌ Failed to remove role from **${failCount}** members` : '',
            `**Reason:** ${reason}`
        ].filter(Boolean).join('\n')).setColor('Orange');

        await interaction.editReply({ embeds: [embed] });
    },
};
