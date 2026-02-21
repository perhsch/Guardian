const Discord = require(`discord.js`);

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

const Infractions = require('../../Schemas/Infractions');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('unban')
        .setDMPermission(false)
        .setDescription('Unbans a member of the discord.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.BanMembers)
        .addUserOption((option) =>
            option.setName('user').setDescription("The user you'd like to unban.").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for unbanning the user.')
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        if (!(await interaction.guild.bans.fetch(user).catch(() => null)))
            return {
                embeds: [EmbedGenerator.errorEmbed('That user is not banned')],
                ephemeral: true,
            };

        interaction.guild.members
            .unban(user, reason)
            .then(async () => {
                await Infractions.updateMany({ type: 'ban' }, { $set: { active: false } });

                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Target: ${user.tag} (${user.id})`,
                        `- Reason: ${reason}`,
                    ].join('\n')
                ).setTitle('/unban command used');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                interaction.reply({
                    embeds: [
                        EmbedGenerator.basicEmbed(`<@${user.id}> has been unbanned. | ${reason}`),
                    ],
                });
            })
            .catch(() => {
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
            });
    },
};
