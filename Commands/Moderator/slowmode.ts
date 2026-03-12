import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    TextChannel,
} from 'discord.js';
import ms from 'ms';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDMPermission(false)
        .setDescription('Sets the slowmode of the channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption((option) =>
            option
                .setName('duration')
                .setDescription('Duration between sending messages in the channel.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for setting the slowmode.')
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.channel) return;

        const duration = interaction.options.getString('duration', true);
        const durationMs = ms(duration);
        const durationSeconds = durationMs ? Math.floor(durationMs / 1000) : NaN;
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';
        const channel = interaction.channel as TextChannel;

        if (isNaN(durationSeconds))
            return interaction.reply({ content: 'Invalid duration.', ephemeral: true });
        if (durationSeconds < 0)
            return interaction.reply({
                content: 'Duration must not be less than 0 seconds.',
                ephemeral: true,
            });
        if (durationSeconds > 21600)
            return interaction.reply({
                content: 'Duration must not be greater than 6 hours.',
                ephemeral: true,
            });

        channel
            .setRateLimitPerUser(durationSeconds, reason)
            .then(async () => {
                const durationString =
                    durationSeconds === 0 ? 'disabled' : ms(durationMs!, { long: true });

                const successEmbed = new EmbedBuilder()
                    .setColor(durationSeconds === 0 ? 0x57f287 : 0xfee75c)
                    .setTitle(`${durationSeconds === 0 ? '🟢' : '⏱️'} Slowmode Updated`)
                    .setThumbnail(interaction.guild!.iconURL({ size: 256 }))
                    .setDescription(
                        `>>> **Channel slowmode has been successfully updated!**\n\n📝 **Details**\n• **Channel**: ${channel.toString()}\n• **Duration**: \`${durationString}\`\n• **Reason**: ${reason}`
                    )
                    .addFields(
                        {
                            name: '🔧 Configuration',
                            value: `• **Set by**: ${interaction.user.toString()}\n• **Time**: <t:${Math.floor(Date.now() / 1000)}:R>`,
                            inline: true,
                        },
                        {
                            name: '📊 Status',
                            value: `• **Previous**: \`${channel.rateLimitPerUser}s\`\n• **New**: \`${durationSeconds}s\``,
                            inline: true,
                        }
                    )
                    .setFooter({
                        text: `Guardian Moderation • ${interaction.guild!.name}`,
                        iconURL: client.user!.displayAvatarURL(),
                    })
                    .setTimestamp();

                const logEmbed = new EmbedBuilder()
                    .setColor(0xfee75c)
                    .setTitle('⚙️ Slowmode Configuration')
                    .setDescription(
                        `>>> **Channel slowmode settings have been modified**\n\n**Action Details**\n• **Moderator**: ${interaction.user.toString()}\n• **Channel**: ${channel.toString()}\n• **New Duration**: \`${durationString}\`\n• **Reason**: ${reason}`
                    )
                    .setTimestamp();

                await sendModLog(interaction.guild!, dbGuild, logEmbed);
                interaction.reply({ embeds: [successEmbed] });
            })
            .catch(() => {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xed4245)
                    .setTitle('❌ Slowmode Error')
                    .setDescription(
                        '>>> **Failed to update channel slowmode**\n\n**Possible Reasons**\n• Bot lacks `Manage Channels` permission\n• Channel permissions conflict\n• Invalid duration specified'
                    )
                    .setTimestamp();
                interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            });
    },
};
