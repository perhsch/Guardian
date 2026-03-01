const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles for server members')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('give')
                .setDescription('Give a role to a specific member')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to give the role to')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to give')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('The reason for giving the role')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a specific member')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to remove the role from')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('The reason for removing the role')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('giveall')
                .setDescription('Give a role to all members in the server')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to give to all members')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('The reason for giving the role to everyone')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeall')
                .setDescription('Remove a role from all members in the server')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to remove from all members')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('The reason for removing the role from everyone')
                        .setRequired(false)
                )
        ),
    async execute(interaction, client, dbGuild) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'give':
                await handleGiveRole(interaction, client, dbGuild);
                break;
            case 'remove':
                await handleRemoveRole(interaction, client, dbGuild);
                break;
            case 'giveall':
                await handleGiveRoleAll(interaction, client, dbGuild);
                break;
            case 'removeall':
                await handleRemoveRoleAll(interaction, client, dbGuild);
                break;
        }
    },
};

async function handleGiveRole(interaction, client, dbGuild) {
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
}

async function handleRemoveRole(interaction, client, dbGuild) {
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

    if (!member.roles.cache.has(role.id)) {
        return await interaction.reply({
            content: `❌ ${user.tag} does not have the ${role.name} role.`,
            ephemeral: true
        });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return await interaction.reply({
            content: '❌ I cannot remove a role that is higher than or equal to my highest role.',
            ephemeral: true
        });
    }

    try {
        await member.roles.remove(role);

        const logEmbed = EmbedGenerator.basicEmbed([
            `**Action:** Role Removed`,
            `**Moderator:** ${interaction.user.tag}`,
            `**User:** ${user.tag} (${user.id})`,
            `**Role:** ${role.name} (${role.id})`,
            `**Reason:** ${reason}`
        ].join('\n')).setTitle('🔸 Role Management');

        await sendModLog(interaction.guild, dbGuild, logEmbed);

        const embed = EmbedGenerator.basicEmbed([
            `✅ Successfully removed **${role.name}** from **${user.tag}**`,
            `**Reason:** ${reason}`
        ].join('\n')).setColor('Orange');

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error removing role:', error);
        await interaction.reply({
            content: '❌ Failed to remove the role. Please check my permissions.',
            ephemeral: true
        });
    }
}

async function handleGiveRoleAll(interaction, client, dbGuild) {
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
}

async function handleRemoveRoleAll(interaction, client, dbGuild) {
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
}
