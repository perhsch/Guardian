import Discord, {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
} from 'discord.js';
import EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('giverole')
        .setDescription('Give a role to a specific member.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addUserOption((option) =>
            option.setName('user').setDescription('The user to give the role to.').setRequired(true)
        )
        .addRoleOption((option) =>
            option.setName('role').setDescription('The role to give.').setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('The reason for giving the role.')
                .setRequired(false)
        ),

    async execute(
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
    },
};
