import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, Client, TextChannel } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDMPermission(false)
        .setDescription('Allows members to send messages in the channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for unlocking the channel.')
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.channel) return;

        const reason = interaction.options.getString('reason') || 'Unspecified reason.';
        const channel = interaction.channel as TextChannel;

        channel.permissionOverwrites
            .edit(interaction.guild.roles.everyone, { SendMessages: true })
            .then(async () => {
                const logEmbed = EmbedGenerator.basicEmbed(
                    [`- Moderator: ${interaction.user.tag}`, `- Channel: <#${channel.id}>`, `- Reason: ${reason}`].join('\n')
                ).setTitle('/unlock command used');
                await sendModLog(interaction.guild!, dbGuild, logEmbed);
                interaction.reply({ embeds: [EmbedGenerator.basicEmbed(`This channel has been unlocked | ${reason}`)] });
            })
            .catch(() => {
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
            });
    },
};
