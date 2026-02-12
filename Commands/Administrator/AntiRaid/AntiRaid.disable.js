const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the anti-raid protection system.'),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/antiraid disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.antiraid.enabled = false;
        dbGuild.antiraid.joinWithin = null;
        dbGuild.antiraid.joinAmount = null;
        dbGuild.antiraid.lockdown.enabled = false;
        dbGuild.antiraid.channel = null;
        dbGuild.antiraid.action = null;

        return EmbedGenerator.basicEmbed('🔓 | Anti-raid protection has been disabled!');
    },
};
