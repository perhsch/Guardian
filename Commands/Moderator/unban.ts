import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';
import Infractions from '../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDMPermission(false)
        .setDescription('Unbans a member of the discord.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption((option) =>
            option.setName('user').setDescription("The user you'd like to unban.").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for unbanning the user.')
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        if (!(await interaction.guild.bans.fetch(user.id).catch(() => null))) {
            return {
                embeds: [EmbedGenerator.errorEmbed('That user is not banned')],
                ephemeral: true,
            };
        }

        interaction.guild.members
            .unban(user, reason)
            .then(async () => {
                await Infractions.updateMany(
                    { type: 'ban', user: user.id, guild: interaction.guild!.id },
                    { $set: { active: false } }
                );

                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Target: ${user.tag} (${user.id})`,
                        `- Reason: ${reason}`,
                    ].join('\n')
                ).setTitle('/unban command used');
                await sendModLog(interaction.guild!, dbGuild, logEmbed);

                interaction.reply({
                    embeds: [
                        EmbedGenerator.basicEmbed(`<@${user.id}> has been unbanned. | ${reason}`),
                    ],
                });
            })
            .catch(() =>
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true })
            );
    },
};
