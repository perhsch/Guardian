const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');
const Guilds = require('../../../Schemas/Guilds');

const textChannel = Discord.ChannelType.GuildText;

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Configure the logging system.')
        .addChannelOption((option) =>
            option
                .setName('log_channel')
                .setDescription('Select the basic logging channel for this system.')
                .addChannelTypes(textChannel)
                .setRequired(true)
        )
        .addChannelOption((option) =>
            option
                .setName('modlog_channel')
                .setDescription('Select the moderator logging channel for this system.')
                .addChannelTypes(textChannel)
        )
        .addChannelOption((option) =>
            option
                .setName('suggestions_channel')
                .setDescription('Optional: default channel for suggestions (/suggest).')
                .addChannelTypes(textChannel)
        )
        .addChannelOption((option) =>
            option
                .setName('announcement_channel')
                .setDescription('Optional: default channel for announcements (/announce).')
                .addChannelTypes(textChannel)
        )
        .addChannelOption((option) =>
            option
                .setName('giveaway_channel')
                .setDescription('Optional: default channel for giveaways.')
                .addChannelTypes(textChannel)
        )
        .addChannelOption((option) =>
            option
                .setName('global_channel')
                .setDescription('Optional: global logging channel for all bot events.')
                .addChannelTypes(textChannel)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const logChannel = interaction.options.getChannel('log_channel', true);
        const modLogChannel = interaction.options.getChannel('modlog_channel');
        const suggestionsChannel = interaction.options.getChannel('suggestions_channel');
        const announcementChannel = interaction.options.getChannel('announcement_channel');
        const giveawayChannel = interaction.options.getChannel('giveaway_channel');
        const globalChannel = interaction.options.getChannel('global_channel');

        dbGuild.logs.enabled = true;
        dbGuild.logs.basic = logChannel.id;
        dbGuild.logs.moderator = modLogChannel?.id ?? null;
        dbGuild.logs.global = globalChannel?.id ?? null;
        dbGuild.logs.suggestionsChannel = suggestionsChannel?.id ?? null;
        dbGuild.logs.announcementChannel = announcementChannel?.id ?? null;
        dbGuild.logs.giveawayChannel = giveawayChannel?.id ?? null;
        if (suggestionsChannel) {
            dbGuild.suggestion.channel = suggestionsChannel.id;
            dbGuild.suggestion.enabled = true;
        }

        const logsPayload = {
            enabled: true,
            basic: logChannel.id,
            moderator: modLogChannel?.id ?? null,
            global: globalChannel?.id ?? null,
            suggestionsChannel: suggestionsChannel?.id ?? null,
            announcementChannel: announcementChannel?.id ?? null,
            giveawayChannel: giveawayChannel?.id ?? null,
        };
        await Guilds.updateOne(
            { guild: interaction.guildId },
            { $set: { logs: logsPayload } }
        );
        if (suggestionsChannel) {
            await Guilds.updateOne(
                { guild: interaction.guildId },
                {
                    $set: {
                        'suggestion.channel': suggestionsChannel.id,
                        'suggestion.enabled': true,
                    },
                }
            );
        }

        const lines = [
            `- Moderator: ${interaction.user.tag}`,
            `- Basic log channel: <#${logChannel.id}>`,
            `- Mod log channel: ${modLogChannel ? `<#${modLogChannel.id}>` : 'Not specified'}`,
            `- Global log channel: ${globalChannel ? `<#${globalChannel.id}>` : 'Not specified'}`,
            suggestionsChannel ? `- Suggestions channel: <#${suggestionsChannel.id}>` : null,
            announcementChannel ? `- Announcement channel: <#${announcementChannel.id}>` : null,
            giveawayChannel ? `- Giveaway channel: <#${giveawayChannel.id}>` : null,
        ].filter(Boolean);
        const logEmbed = EmbedGenerator.basicEmbed(lines.join('\n')).setTitle(
            '/logging setup command used'
        );
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        const replyLines = [
            '🔒 | The logging system has been enabled!',
            '',
            `• Basic Logging Channel: <#${logChannel.id}>`,
            `• Moderator Logging Channel: ${modLogChannel ? `<#${modLogChannel.id}>` : 'Not specified'}`,
            `• Global Logging Channel: ${globalChannel ? `<#${globalChannel.id}>` : 'Not specified'}`,
            suggestionsChannel ? `• Suggestions Channel: <#${suggestionsChannel.id}>` : null,
            announcementChannel ? `• Announcement Channel: <#${announcementChannel.id}>` : null,
            giveawayChannel ? `• Giveaway Channel: <#${giveawayChannel.id}>` : null,
        ].filter(Boolean);
        return EmbedGenerator.basicEmbed(replyLines.join('\n'));
    },
};
