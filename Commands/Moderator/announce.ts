import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    ChannelType,
    TextChannel,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Announce a message to the server')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption((option) =>
            option.setName('message').setDescription('Message to announce').setRequired(true)
        )
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription(
                    'Channel to announce in (optional if default set via /logging setup)'
                )
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        let channel = interaction.options.getChannel('channel') as TextChannel | null;
        if (!channel && dbGuild.logs?.announcementChannel) {
            channel = (await interaction.guild.channels
                .fetch(dbGuild.logs.announcementChannel)
                .catch(() => null)) as TextChannel | null;
        }

        if (!channel || !(channel instanceof TextChannel)) {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'No channel specified. Provide a channel option or set a default announcement channel via `/logging setup`.'
                    ),
                ],
                ephemeral: true,
            };
        }

        const message = interaction.options.getString('message', true);

        if (
            !channel
                .permissionsFor(interaction.guild.members.me!)
                ?.has(PermissionFlagsBits.SendMessages)
        ) {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        ':x: | I do not have permissions to send messages in this channel!'
                    ),
                ],
                ephemeral: true,
            };
        }

        const announcementEmbed = EmbedGenerator.basicEmbed()
            .setColor(0xf1c40f)
            .setTitle('📢 Server Announcement')
            .setDescription(message)
            .setAuthor({
                name: interaction.user.displayName,
                iconURL: interaction.user.displayAvatarURL({ size: 256 }),
            })
            .setFooter({
                text: `${interaction.guild.name} • Announcement`,
                iconURL: interaction.guild.iconURL({ size: 64 }) ?? undefined,
            })
            .setTimestamp();

        const channelRef = channel;
        channel
            .send({ embeds: [announcementEmbed] })
            .then(async () => {
                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Channel: <#${channelRef.id}>`,
                        `- Message: ${message.substring(0, 500)}${message.length > 500 ? '...' : ''}`,
                    ].join('\n')
                ).setTitle('/announce command used');
                await sendModLog(interaction.guild!, dbGuild, logEmbed);
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed(':mega: | Announced message successfully!')],
                    ephemeral: true,
                });
            })
            .catch(() =>
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true })
            );

        return;
    },
};
