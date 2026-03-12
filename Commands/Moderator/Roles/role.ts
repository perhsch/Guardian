import Discord, {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
    Collection,
} from 'discord.js';
import EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

async function handleGiveRole(
    interaction: ChatInputCommandInteraction,
    _client: Client,
    dbGuild: any
): Promise<void> {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
        await interaction.reply({
            content: '❌ Unable to find that user in this server.',
            ephemeral: true,
        });
        return;
    }

    if (member.roles.cache.has(role.id)) {
        await interaction.reply({
            content: `❌ ${user.tag} already has the ${role.name} role.`,
            ephemeral: true,
        });
        return;
    }

    if (role.position >= interaction.guild.members.me!.roles.highest.position) {
        await interaction.reply({
            content: '❌ I cannot give a role that is higher than or equal to my highest role.',
            ephemeral: true,
        });
        return;
    }

    try {
        await member.roles.add(role.id);

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `**Action:** Role Given`,
                `**Moderator:** ${interaction.user.tag}`,
                `**User:** ${user.tag} (${user.id})`,
                `**Role:** ${role.name} (${role.id})`,
                `**Reason:** ${reason}`,
            ].join('\n')
        ).setTitle('🔹 Role Management');

        await sendModLog(interaction.guild, dbGuild, logEmbed);

        const embed = EmbedGenerator.basicEmbed(
            [
                `✅ Successfully gave **${role.name}** to **${user.tag}**`,
                `**Reason:** ${reason}`,
            ].join('\n')
        ).setColor('Green');

        await interaction.reply({ embeds: [embed] });
    } catch (error: unknown) {
        console.error('Error giving role:', error);
        await interaction.reply({
            content: '❌ Failed to give the role. Please check my permissions.',
            ephemeral: true,
        });
    }
}

async function handleRemoveRole(
    interaction: ChatInputCommandInteraction,
    _client: Client,
    dbGuild: any
): Promise<void> {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
        await interaction.reply({
            content: '❌ Unable to find that user in this server.',
            ephemeral: true,
        });
        return;
    }

    if (!member.roles.cache.has(role.id)) {
        await interaction.reply({
            content: `❌ ${user.tag} does not have the ${role.name} role.`,
            ephemeral: true,
        });
        return;
    }

    if (role.position >= interaction.guild.members.me!.roles.highest.position) {
        await interaction.reply({
            content: '❌ I cannot remove a role that is higher than or equal to my highest role.',
            ephemeral: true,
        });
        return;
    }

    try {
        await member.roles.remove(role.id);

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `**Action:** Role Removed`,
                `**Moderator:** ${interaction.user.tag}`,
                `**User:** ${user.tag} (${user.id})`,
                `**Role:** ${role.name} (${role.id})`,
                `**Reason:** ${reason}`,
            ].join('\n')
        ).setTitle('🔸 Role Management');

        await sendModLog(interaction.guild, dbGuild, logEmbed);

        const embed = EmbedGenerator.basicEmbed(
            [
                `✅ Successfully removed **${role.name}** from **${user.tag}**`,
                `**Reason:** ${reason}`,
            ].join('\n')
        ).setColor('Orange');

        await interaction.reply({ embeds: [embed] });
    } catch (error: unknown) {
        console.error('Error removing role:', error);
        await interaction.reply({
            content: '❌ Failed to remove the role. Please check my permissions.',
            ephemeral: true,
        });
    }
}

async function handleGiveRoleAll(
    interaction: ChatInputCommandInteraction,
    _client: Client,
    dbGuild: any
): Promise<void> {
    if (!interaction.guild) return;

    const role = interaction.options.getRole('role', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (role.position >= interaction.guild.members.me!.roles.highest.position) {
        await interaction.reply({
            content: '❌ I cannot give a role that is higher than or equal to my highest role.',
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply();

    const members: Collection<string, GuildMember> = interaction.guild.members.cache.filter(
        (member: GuildMember) => !member.roles.cache.has(role.id)
    );
    let successCount = 0;
    let failCount = 0;

    for (const member of members.values()) {
        try {
            await member.roles.add(role.id);
            successCount++;
        } catch (error: unknown) {
            failCount++;
            console.error(`Failed to give role to ${member.user.tag}:`, error);
        }
    }

    const logEmbed = EmbedGenerator.basicEmbed(
        [
            `**Action:** Mass Role Given`,
            `**Moderator:** ${interaction.user.tag}`,
            `**Role:** ${role.name} (${role.id})`,
            `**Members affected:** ${successCount}`,
            `**Failed:** ${failCount}`,
            `**Reason:** ${reason}`,
        ].join('\n')
    ).setTitle('🔹 Mass Role Management');

    await sendModLog(interaction.guild, dbGuild, logEmbed);

    const embed = EmbedGenerator.basicEmbed(
        [
            `✅ Successfully gave **${role.name}** to **${successCount}** members`,
            failCount > 0 ? `❌ Failed to give role to **${failCount}** members` : '',
            `**Reason:** ${reason}`,
        ]
            .filter(Boolean)
            .join('\n')
    ).setColor('Green');

    await interaction.editReply({ embeds: [embed] });
}

async function handleRemoveRoleAll(
    interaction: ChatInputCommandInteraction,
    _client: Client,
    dbGuild: any
): Promise<void> {
    if (!interaction.guild) return;

    const role = interaction.options.getRole('role', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (role.position >= interaction.guild.members.me!.roles.highest.position) {
        await interaction.reply({
            content: '❌ I cannot remove a role that is higher than or equal to my highest role.',
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply();

    const members: Collection<string, GuildMember> = interaction.guild.members.cache.filter(
        (member: GuildMember) => member.roles.cache.has(role.id)
    );
    let successCount = 0;
    let failCount = 0;

    for (const member of members.values()) {
        try {
            await member.roles.remove(role.id);
            successCount++;
        } catch (error: unknown) {
            failCount++;
            console.error(`Failed to remove role from ${member.user.tag}:`, error);
        }
    }

    const logEmbed = EmbedGenerator.basicEmbed(
        [
            `**Action:** Mass Role Removed`,
            `**Moderator:** ${interaction.user.tag}`,
            `**Role:** ${role.name} (${role.id})`,
            `**Members affected:** ${successCount}`,
            `**Failed:** ${failCount}`,
            `**Reason:** ${reason}`,
        ].join('\n')
    ).setTitle('🔸 Mass Role Management');

    await sendModLog(interaction.guild, dbGuild, logEmbed);

    const embed = EmbedGenerator.basicEmbed(
        [
            `✅ Successfully removed **${role.name}** from **${successCount}** members`,
            failCount > 0 ? `❌ Failed to remove role from **${failCount}** members` : '',
            `**Reason:** ${reason}`,
        ]
            .filter(Boolean)
            .join('\n')
    ).setColor('Orange');

    await interaction.editReply({ embeds: [embed] });
}

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles for server members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
            subcommand
                .setName('give')
                .setDescription('Give a role to a specific member')
                .addUserOption((option) =>
                    option
                        .setName('user')
                        .setDescription('The user to give the role to')
                        .setRequired(true)
                )
                .addRoleOption((option) =>
                    option.setName('role').setDescription('The role to give').setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName('reason')
                        .setDescription('The reason for giving the role')
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a specific member')
                .addUserOption((option) =>
                    option
                        .setName('user')
                        .setDescription('The user to remove the role from')
                        .setRequired(true)
                )
                .addRoleOption((option) =>
                    option.setName('role').setDescription('The role to remove').setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName('reason')
                        .setDescription('The reason for removing the role')
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('giveall')
                .setDescription('Give a role to all members in the server')
                .addRoleOption((option) =>
                    option
                        .setName('role')
                        .setDescription('The role to give to all members')
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName('reason')
                        .setDescription('The reason for giving the role to everyone')
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('removeall')
                .setDescription('Remove a role from all members in the server')
                .addRoleOption((option) =>
                    option
                        .setName('role')
                        .setDescription('The role to remove from all members')
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName('reason')
                        .setDescription('The reason for removing the role from everyone')
                        .setRequired(false)
                )
        ),

    async execute(
        interaction: ChatInputCommandInteraction,
        client: Client,
        dbGuild: any
    ): Promise<void> {
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
