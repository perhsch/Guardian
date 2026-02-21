const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

const Infractions = require('../../Schemas/Infractions');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('kick')
        .setDMPermission(false)
        .setDescription('Kicks a member of the discord.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
            option.setName(`user`).setDescription(`The user you'd like to kick.`).setRequired(true)
        )
        .addStringOption((option) =>
            option.setName(`reason`).setDescription(`Reason for kicking the user.`)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const user = interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch({ user: user.id }).catch(() => null);
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        if (!member)
            return interaction.reply({
                content: 'That user is no longer in the server.',
                ephemeral: true,
            });
        if (!member.kickable)
            return interaction.reply({ content: 'User cannot be kicked.', ephemeral: true });

        const infractionEmbed = EmbedGenerator.infractionEmbed(
            interaction.guild,
            interaction.user.id,
            'Kick',
            null,
            null,
            reason
        );
        await member.send({ embeds: [infractionEmbed] }).catch(() => null);

        member
            .kick(reason)
            .then(async () => {
                await Infractions.create({
                    guild: interaction.guild.id,
                    user: member.id,
                    issuer: interaction.user.id,
                    type: 'kick',
                    reason: reason,
                    active: false,
                });

                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Target: ${member.user.tag} (${member.id})`,
                        `- Reason: ${reason}`,
                    ].join('\n')
                ).setTitle('/kick command used');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                interaction.reply({ embeds: [infractionEmbed] });
            })
            .catch(() => {
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
            });
    },
};
