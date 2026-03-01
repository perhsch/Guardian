const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('giveroleall')
        .setDescription('Gives a specified role to all members in the server.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription('The role to give to all members.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('The reason for giving the role to everyone.')
                .setRequired(false)
        ),
    async execute(interaction, client, dbGuild) {
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return await interaction.reply({
                content: '❌ I cannot give a role that is higher than or equal to my highest role.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const members = interaction.guild.members.cache.filter(member => !member.roles.cache.has(role.id));
        let successCount = 0;
        let failCount = 0;

        for (const member of members.values()) {
            try {
                await member.roles.add(role);
                successCount++;
            } catch (error) {
                failCount++;
                console.error(`Failed to give role to ${member.user.tag}:`, error);
            }
        }

        const logEmbed = EmbedGenerator.basicEmbed([
            `**Action:** Mass Role Given`,
            `**Moderator:** ${interaction.user.tag}`,
            `**Role:** ${role.name} (${role.id})`,
            `**Members affected:** ${successCount}`,
            `**Failed:** ${failCount}`,
            `**Reason:** ${reason}`
        ].join('\n')).setTitle('🔹 Mass Role Management');

        await sendModLog(interaction.guild, dbGuild, logEmbed);

        const embed = EmbedGenerator.basicEmbed([
            `✅ Successfully gave **${role.name}** to **${successCount}** members`,
            failCount > 0 ? `❌ Failed to give role to **${failCount}** members` : '',
            `**Reason:** ${reason}`
        ].filter(Boolean).join('\n')).setColor('Green');

        await interaction.editReply({ embeds: [embed] });
    },
};
