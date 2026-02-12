const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('announce')
        .setDescription('Announce a message to the server')
        .setDMPermission(false)
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Channel to announce the message in')
                .setRequired(true)
                .addChannelTypes(Discord.ChannelType.GuildText)
        )
        .addStringOption((option) =>
            option.setName('message').setDescription('Message to announce').setRequired(true)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        /** @type {Discord.TextChannel} */ const channel = interaction.options.getChannel(
            'channel',
            true
        );
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

        const announcementEmbed = new Discord.EmbedBuilder()
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
            .then(() => {
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
