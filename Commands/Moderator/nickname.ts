import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    GuildMember,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('nickname')
        .setDMPermission(false)
        .setDescription("Force change a member's nickname.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription("The user you'd like to change the nickname of.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('The new nickname for the user.')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch({ user: user.id }).catch(() => null);
        const newNickname = interaction.options.getString('name', true);

        if (!member)
            return interaction.reply({
                content: 'That user is no longer in the server.',
                ephemeral: true,
            });
        if (user.id === interaction.user.id)
            return interaction.reply({
                content: 'You cannot change your own nickname with this command.',
                ephemeral: true,
            });
        if (!member.manageable)
            return interaction.reply({
                content:
                    "I cannot change this user's nickname. They may have higher permissions than me.",
                ephemeral: true,
            });

        const interactionMember = interaction.member as GuildMember;
        if (
            member.roles.highest.position >= interactionMember.roles.highest.position &&
            interaction.user.id !== interaction.guild.ownerId
        ) {
            return interaction.reply({
                content:
                    'You cannot change the nickname of someone with equal or higher roles than you.',
                ephemeral: true,
            });
        }

        const oldNickname = member.nickname || member.user.username;

        try {
            await member.setNickname(newNickname, `Changed by ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Nickname Changed')
                .setDescription(`Successfully changed **${user.tag}**'s nickname.`)
                .addFields(
                    { name: '📝 Old Nickname', value: `\`${oldNickname}\``, inline: true },
                    { name: '🔄 New Nickname', value: `\`${newNickname}\``, inline: true },
                    { name: '👮 Changed By', value: `${interaction.user.tag}`, inline: false }
                )
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            const logEmbed = EmbedGenerator.basicEmbed(
                [
                    `- Moderator: ${interaction.user.tag}`,
                    `- Target: ${user.tag} (${user.id})`,
                    `- Old Nickname: "${oldNickname}"`,
                    `- New Nickname: "${newNickname}"`,
                ].join('\n')
            ).setTitle('/nickname command used');
            await sendModLog(interaction.guild, dbGuild, logEmbed);
        } catch (error) {
            console.error('Nickname change error:', error);
            return interaction.reply({
                content: 'An error occurred while trying to change the nickname.',
                ephemeral: true,
            });
        }
    },
};
