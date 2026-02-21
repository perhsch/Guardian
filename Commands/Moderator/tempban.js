const Discord = require(`discord.js`);
const ms = require('ms');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

const Infractions = require('../../Schemas/Infractions');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('tempban')
        .setDMPermission(false)
        .setDescription('Temporarily bans a member of the discord.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.BanMembers)
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription("The user you'd like to tempban.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('duration')
                .setDescription('How long to tempban the user for.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('delete_messages')
                .setDescription('How much of their recent message history to delete.')
                .addChoices(
                    { name: "Don't delete any", value: '0s' },
                    { name: 'Previous Hour', value: '1h' },
                    { name: 'Previous 6 Hours', value: '6h' },
                    { name: 'Previous 12 Hours', value: '12h' },
                    { name: 'Previous 24 Hours', value: '24h' },
                    { name: 'Previous 3 Days', value: '3d' },
                    { name: 'Previous 7 Days', value: '7d' }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for banning the user.')
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const user = interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch({ user: user.id }).catch(() => null);
        const deleteMessages = interaction.options.getString('delete_messages', true);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        const duration = await interaction.options.getString('duration', true);
        const durationMs = ms(duration);
        if (!durationMs || isNaN(durationMs))
            return { embeds: [EmbedGenerator.errorEmbed('Invalid duration.')], ephemeral: true };
        if (durationMs < 1000)
            return {
                embeds: [EmbedGenerator.errorEmbed('Duration must be longer than 1s')],
                ephemeral: true,
            };

        if (!member)
            return {
                embeds: [EmbedGenerator.errorEmbed('That user is no longer in the server.')],
                ephemeral: true,
            };
        if (!member.bannable)
            return {
                embeds: [EmbedGenerator.errorEmbed('User cannot be banned.')],
                ephemeral: true,
            };

        const infractionEmbed = EmbedGenerator.infractionEmbed(
            interaction.guild,
            interaction.user.id,
            'Temp-Ban',
            durationMs,
            Date.now() + durationMs,
            reason
        );
        await member.send({ embeds: [infractionEmbed] }).catch(() => null);

        member
            .ban({
                reason: reason,
                deleteMessageSeconds: ms(deleteMessages) / 1000,
            })
            .then(async () => {
                await client.expiringDocumentsManager.infractions.addNewDocument(
                    await Infractions.create({
                        guild: interaction.guild.id,
                        user: member.id,
                        issuer: interaction.user.id,
                        type: 'ban',
                        reason: reason,
                        duration: durationMs,
                    })
                );

                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Target: ${member.user.tag} (${member.id})`,
                        `- Duration: ${duration}`,
                        `- Delete messages: ${deleteMessages}`,
                        `- Reason: ${reason}`,
                    ].join('\n')
                ).setTitle('/tempban command used');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                interaction.reply({
                    embeds: [
                        EmbedGenerator.basicEmbed()
                            .setAuthor({ name: 'Ban issued', iconURL: interaction.guild.iconURL() })
                            .setDescription([infractionEmbed].join('\n'))
                            .setTimestamp(),
                    ],
                });
            })
            .catch(() => {
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
            });
    },
};
