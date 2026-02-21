const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the verification system.'),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (!dbGuild.verification.enabled)
            return EmbedGenerator.errorEmbed('The verification system is not enabled!');

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/verification disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.verification.enabled = false;
        dbGuild.verification.version = null;
        dbGuild.verification.channel = null;
        dbGuild.verification.role = null;
        dbGuild.verification.unverifiedRole = null;

        return EmbedGenerator.basicEmbed('🔓 | Member verification has been disabled.');
    },
};
