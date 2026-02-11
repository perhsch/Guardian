const Discord = require('discord.js');
const Transcripts = require('discord-html-transcripts');

const { GuildsManager } = require('../../Classes/GuildsManager');
const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('clear')
        .setDMPermission(false)
        .setDescription('Bulk delete messages')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .addNumberOption((option) =>
            option
                .setName('amount')
                .setDescription('Amount of messages to delete.')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for deleting.').setRequired(true)
        )
        .addUserOption((option) =>
            option.setName('target').setDescription('Only delete messages from this user.')
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const amount = interaction.options.getNumber('amount', true);
        const reason = interaction.options.getString('reason', true);
        const target = interaction.options.getUser('target');

        /** @type {Discord.Collection<string, Discord.Message>} */ let messages =
            await interaction.channel.messages.fetch({ limit: amount });
        if (target) messages = messages.filter((message) => message.author.id === target.id);
        if (messages.size === 0)
            return { embeds: [EmbedGenerator.errorEmbed('No messages found.')], ephemeral: true };

        /** @type {Discord.TextChannel} */ (interaction.channel)
            .bulkDelete(messages, true)
            .then(async (deleted) => {
                interaction.reply({
                    embeds: [
                        EmbedGenerator.basicEmbed(
                            `Cleared \`${messages.size}\` messages${
                                target ? ` from ${target}` : ''
                            }.`
                        ),
                    ],
                    ephemeral: true,
                });

                if (dbGuild.logs.enabled) {
                    const channel = await interaction.guild.channels
                        .fetch(dbGuild.logs.moderator)
                        .catch(() => null);
                    if (channel && channel instanceof Discord.TextChannel) {
                        try {
                            const transcript = await Transcripts.generateFromMessages(
                                messages,
                                interaction.channel
                            );

                            const moderatorText =
                                interaction.member && interaction.member.user
                                    ? interaction.member.user.tag
                                    : interaction.member
                                      ? String(interaction.member)
                                      : 'Unknown';

                            const targetText = target ? target.tag || `<@${target.id}>` : 'None';

                            const logEmbed = EmbedGenerator.basicEmbed(
                                [
                                    `- Moderator: ${moderatorText}`,
                                    `- Target: ${targetText}`,
                                    `- Channel: <#${interaction.channel.id}>`,
                                    `- Reason: ${reason}`,
                                ].join('\n')
                            ).setTitle('/clear command used');

                            await channel.send({ embeds: [logEmbed], files: [transcript] });
                        } catch (err) {
                            console.error('Error creating/sending clear transcript/log:', err);
                        }
                    }
                }
            })
            .catch(() => {
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
            });
    },
};
