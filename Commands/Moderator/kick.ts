import Discord, {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
} from 'discord.js';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';
import Infractions from '../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDMPermission(false)
        .setDescription('Kicks a member of the discord.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
            option.setName('user').setDescription("The user you'd like to kick.").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for kicking the user.')
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        if (!member) {
            return interaction.reply({
                content: 'That user is no longer in the server.',
                ephemeral: true,
            });
        }
        if (!member.kickable) {
            return interaction.reply({ content: 'User cannot be kicked.', ephemeral: true });
        }

        const infractionEmbed = EmbedGenerator.infractionEmbed(
            interaction.guild,
            interaction.user.id,
            'Kick',
            null,
            null,
            reason
        );
        await member.send({ embeds: [infractionEmbed] }).catch(() => null);

        try {
            await member.kick(reason);

            await Infractions.create({
                guild: interaction.guild.id,
                user: member.id,
                issuer: interaction.user.id,
                type: 'kick',
                reason: reason,
                active: false,
            });

            const logEmbed = EmbedGenerator.basicEmbed(
                [
                    `- Moderator: ${interaction.user.tag}`,
                    `- Target: ${member.user.tag} (${member.id})`,
                    `- Reason: ${reason}`,
                ].join('\n')
            ).setTitle('/kick command used');
            await sendModLog(interaction.guild, dbGuild, logEmbed);

            await interaction.reply({ embeds: [infractionEmbed] });
        } catch {
            await interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('Failed to kick the user.')],
                ephemeral: true,
            });
        }
    },
};
