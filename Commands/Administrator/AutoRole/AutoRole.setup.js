const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Configure the auto-role system.')
        .addRoleOption((option) =>
            option
                .setName('member')
                .setDescription('Select the role given to new members.')
                .setRequired(true)
        )
        .addRoleOption((option) =>
            option.setName('bot').setDescription('Select the role given to new bots.')
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const memberRole = interaction.options.getRole('member', true);
        const botRole = interaction.options.getRole('bot');

        dbGuild.autorole.enabled = true;
        dbGuild.autorole.member = memberRole.id;
        dbGuild.autorole.bot = botRole?.id;

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Member role: ${memberRole}`,
                `- Bot role: ${botRole || 'Not specified'}`,
            ].join('\n')
        ).setTitle('/autorole setup command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return EmbedGenerator.basicEmbed(
            [
                '🔒 | The Auto-Role system has been enabled!',
                '',
                `• Member Auto-Role Updated: <@&${memberRole.id}>`,
                `• Bot Auto-Role Updated: ${botRole ? `<@&${botRole.id}>` : 'Not Specified.'}`,
            ].join('\n')
        );
    },
};
