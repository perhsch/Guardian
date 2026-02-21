const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('announce')
        .setDescription('Announce a message to the server')
        .setDMPermission(false)
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
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
                .addChannelTypes(Discord.ChannelType.GuildText)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        let /** @type {Discord.TextChannel | null} */ channel = interaction.options.getChannel(
            'channel'
        );
        if (!channel && dbGuild.logs.announcementChannel) {
            channel = await interaction.guild.channels
                .fetch(dbGuild.logs.announcementChannel)
                .catch(() => null);
        }
        if (!channel || !(channel instanceof Discord.TextChannel)) {
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
                .permissionsFor(interaction.guild.members.me)
                .has(Discord.PermissionFlagsBits.SendMessages)
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
            .setColor(0xf1c40f) // Amber/gold for announcements
            .setTitle('📢 Server Announcement')
            .setDescription(message)
            .setAuthor({
                name: interaction.user.displayName,
                iconURL: interaction.user.displayAvatarURL({ size: 256 }),
            })
            .setFooter({
                text: `${interaction.guild.name} • Announcement`,
                iconURL: interaction.guild.iconURL({ size: 64 }),
            })
            .setTimestamp();

        channel
            .send({
                embeds: [announcementEmbed],
            })
            .then(async () => {
                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Channel: <#${channel.id}>`,
                        `- Message: ${message.substring(0, 500)}${message.length > 500 ? '...' : ''}`,
                    ].join('\n')
                ).setTitle('/announce command used');
                await sendModLog(interaction.guild, dbGuild, logEmbed);
                interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed(':mega: | Announced message successfully!')],
                    ephemeral: true,
                });
            })
            .catch(() => {
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
            });
    },
};
