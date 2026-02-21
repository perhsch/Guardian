const Discord = require('discord.js');
const ms = require('ms');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('slowmode')
        .setDMPermission(false)
        .setDescription('Sets the slowmode of the channel.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageChannels)
        .addStringOption((option) =>
            option
                .setName('duration')
                .setDescription('Duration between sending messages in the channel.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for setting the slowmode.')
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const duration = interaction.options.getString('duration', true);
        const durationSeconds = Math.floor(ms(duration) / 1000);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';
        /** @type {Discord.TextChannel} */ const channel = interaction.channel;

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
                    durationSeconds === 0 ? 'disabled' : ms(ms(duration), { long: true });

                // Enhanced success embed
                const successEmbed = new Discord.EmbedBuilder()
                    .setColor(durationSeconds === 0 ? 0x57f287 : 0xfee75c)
                    .setTitle(`${durationSeconds === 0 ? '🟢' : '⏱️'} Slowmode Updated`)
                    .setThumbnail(interaction.guild.iconURL({ size: 256 }))
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
                        text: `Guardian Moderation • ${interaction.guild.name}`,
                        iconURL: client.user.displayAvatarURL(),
                    })
                    .setTimestamp();

                // Enhanced moderation log embed
                const logEmbed = new Discord.EmbedBuilder()
                    .setColor(0xfee75c)
                    .setTitle('⚙️ Slowmode Configuration')
                    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
                    .setDescription(
                        `>>> **Channel slowmode settings have been modified**\n\n**Action Details**\n• **Moderator**: ${interaction.user.toString()}\n• **Channel**: ${channel.toString()}\n• **New Duration**: \`${durationString}\`\n• **Reason**: ${reason}`
                    )
                    .addFields({
                        name: '🔍 Technical Information',
                        value: `• **Channel ID**: \`${channel.id}\`\n• **Moderator ID**: \`${interaction.user.id}\`\n• **Previous Rate Limit**: \`${channel.rateLimitPerUser}s\`\n• **New Rate Limit**: \`${durationSeconds}s\``,
                        inline: false,
                    })
                    .setFooter({
                        text: `Moderation Log • ${interaction.guild.name}`,
                        iconURL: interaction.guild.iconURL(),
                    })
                    .setTimestamp();

                await sendModLog(interaction.guild, dbGuild, logEmbed);
                interaction.reply({ embeds: [successEmbed] });
            })
            .catch(() => {
                const errorEmbed = new Discord.EmbedBuilder()
                    .setColor(0xed4245)
                    .setTitle('❌ Slowmode Error')
                    .setThumbnail(interaction.guild.iconURL({ size: 256 }))
                    .setDescription(
                        `>>> **Failed to update channel slowmode**\n\n**Possible Reasons**\n• Bot lacks \`Manage Channels\` permission\n• Channel permissions conflict\n• Invalid duration specified`
                    )
                    .addFields({
                        name: '🔧 Troubleshooting',
                        value: `• Check bot permissions\n• Verify channel settings\n• Ensure duration is between 0-6 hours`,
                        inline: false,
                    })
                    .setFooter({
                        text: `Guardian Moderation • Error occurred`,
                        iconURL: client.user.displayAvatarURL(),
                    })
                    .setTimestamp();

                interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            });
    },
};
