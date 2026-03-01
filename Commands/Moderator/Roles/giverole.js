const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('giverole')
        .setDescription('Give a role to a specific member.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('The user to give the role to.')
                .setRequired(true)
        )
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription('The role to give.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('The reason for giving the role.')
                .setRequired(false)
        ),
    async execute(interaction, client, dbGuild) {
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return await interaction.reply({
                content: '❌ Unable to find that user in this server.',
                ephemeral: true
            });
        }

        if (member.roles.cache.has(role.id)) {
            return await interaction.reply({
                content: `❌ ${user.tag} already has the ${role.name} role.`,
                ephemeral: true
            });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return await interaction.reply({
                content: '❌ I cannot give a role that is higher than or equal to my highest role.',
                ephemeral: true
            });
        }

        try {
            await member.roles.add(role);

            const logEmbed = EmbedGenerator.basicEmbed([
                `**Action:** Role Given`,
                `**Moderator:** ${interaction.user.tag}`,
                `**User:** ${user.tag} (${user.id})`,
                `**Role:** ${role.name} (${role.id})`,
                `**Reason:** ${reason}`
            ].join('\n')).setTitle('🔹 Role Management');

            await sendModLog(interaction.guild, dbGuild, logEmbed);

            const embed = EmbedGenerator.basicEmbed([
                `✅ Successfully gave **${role.name}** to **${user.tag}**`,
                `**Reason:** ${reason}`
            ].join('\n')).setColor('Green');

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error giving role:', error);
            await interaction.reply({
                content: '❌ Failed to give the role. Please check my permissions.',
                ephemeral: true
            });
        }
    },
};
