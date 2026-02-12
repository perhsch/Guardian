const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');
const Guilds = require('../../../Schemas/Guilds');

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the logging system.'),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (!dbGuild.logs.enabled)
            return EmbedGenerator.errorEmbed('The logging system is not enabled!');

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/logging disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.logs.enabled = false;
        dbGuild.logs.basic = null;
        dbGuild.logs.moderator = null;

        await Guilds.updateOne(
            { guild: interaction.guildId },
            { $set: { logs: { enabled: false, basic: null, moderator: null } } }
        );

        return EmbedGenerator.basicEmbed('🔓 | The logging system has been disabled!');
    },
};
