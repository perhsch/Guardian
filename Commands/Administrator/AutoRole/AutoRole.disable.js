const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the auto-role system.'),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (!dbGuild.autorole.enabled)
            return EmbedGenerator.errorEmbed('The Auto-Role system is not enabled!');

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/autorole disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.autorole.enabled = false;
        dbGuild.autorole.member = null;
        dbGuild.autorole.bot = null;

        return EmbedGenerator.basicEmbed('🔓 | The Auto-Role system has been disabled!');
    },
};
