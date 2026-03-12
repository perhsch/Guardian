import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
    TextChannel,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('hide')
        .setDescription('Hide a text channel.')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Text channel mention to hide.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.member) return;

        if (
            !(interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageChannels)
        ) {
            return interaction.reply({
                embeds: [
                    EmbedGenerator.basicEmbed().setDescription(
                        "You don't have `ManageChannels` permission."
                    ),
                ],
                ephemeral: true,
            });
        }

        const channel = interaction.options.getChannel('channel') as TextChannel;

        await channel.edit({
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: ['ViewChannel'] },
            ],
        });

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Channel: ${channel.name} (<#${channel.id}>)`,
            ].join('\n')
        ).setTitle('/hide command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return interaction.reply({
            embeds: [
                EmbedGenerator.basicEmbed().setDescription(
                    `The Channel ${channel.name} Has Been Hidden Successfully`
                ),
            ],
        });
    },
};
