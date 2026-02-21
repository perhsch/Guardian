const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the ticket system.'),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/ticketadmin disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.tickets.enabled = false;
        dbGuild.tickets.category = null;
        dbGuild.tickets.channel = null;
        dbGuild.tickets.role = null;
        dbGuild.tickets.logChannel = null;

        return EmbedGenerator.basicEmbed('🔓 | Ticket system has been disabled!');
    },
};
