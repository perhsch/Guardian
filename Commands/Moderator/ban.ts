import Discord, { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, Client } from 'discord.js';
import ms from 'ms';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';
import Infractions from '../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDMPermission(false)
        .setDescription('Bans a member of the discord.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption((option) =>
            option.setName('user').setDescription("The user you'd like to ban.").setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('delete_messages')
                .setDescription('How much of their recent message history to delete.')
                .addChoices(
                    { name: "Don't delete any", value: '0s' },
                    { name: 'Previous Hour', value: '1h' },
                    { name: 'Previous 6 Hours', value: '6h' },
                    { name: 'Previous 12 Hours', value: '12h' },
                    { name: 'Previous 24 Hours', value: '24h' },
                    { name: 'Previous 3 Days', value: '3d' },
                    { name: 'Previous 7 Days', value: '7d' }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for banning the user.')
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const deleteMessages = interaction.options.getString('delete_messages', true);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        if (!member) {
            return interaction.reply({
                content: 'That user is no longer in the server.',
                ephemeral: true,
            });
        }
        if (!member.bannable) {
            return interaction.reply({ content: 'User cannot be banned.', ephemeral: true });
        }

        const infractionEmbed = EmbedGenerator.infractionEmbed(
            interaction.guild,
            interaction.user.id,
            'Ban',
            null,
            null,
            reason
        );
        await member.send({ embeds: [infractionEmbed] }).catch(() => null);

        try {
            await member.ban({
                reason: reason,
                deleteMessageSeconds: ms(deleteMessages) / 1000,
            });

            await Infractions.create({
                guild: interaction.guild.id,
                user: member.id,
                issuer: interaction.user.id,
                type: 'ban',
                reason: reason,
                active: true,
            });

            const logEmbed = EmbedGenerator.basicEmbed(
                [
                    `- Moderator: ${interaction.user.tag}`,
                    `- Target: ${member.user.tag} (${member.id})`,
                    `- Delete messages: ${deleteMessages}`,
                    `- Reason: ${reason}`,
                ].join('\n')
            ).setTitle('/ban command used');
            await sendModLog(interaction.guild, dbGuild, logEmbed);

            await interaction.reply({ embeds: [infractionEmbed] });
        } catch {
            await interaction.reply({ embeds: [EmbedGenerator.errorEmbed('Failed to ban the user.')], ephemeral: true });
        }
    },
};
