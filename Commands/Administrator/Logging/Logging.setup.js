const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');
const Guilds = require('../../../Schemas/Guilds');

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Configure the logging system.')
        .addChannelOption((option) =>
            option
                .setName('log_channel')
                .setDescription('Select the basic logging channel for this system.')
                .addChannelTypes(Discord.ChannelType.GuildText)
                .setRequired(true)
        )
        .addChannelOption((option) =>
            option
                .setName('modlog_channel')
                .setDescription('Select the moderator logging channel for this system.')
                .addChannelTypes(Discord.ChannelType.GuildText)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const logChannel = interaction.options.getChannel('log_channel', true);
        const modLogChannel = interaction.options.getChannel('modlog_channel');

        dbGuild.logs.enabled = true;
        dbGuild.logs.basic = logChannel.id;
        dbGuild.logs.moderator = modLogChannel?.id ?? null;

        await Guilds.updateOne(
            { guild: interaction.guildId },
            {
                $set: {
                    logs: {
                        enabled: true,
                        basic: logChannel.id,
                        moderator: modLogChannel?.id ?? null,
                    },
                },
            }
        );

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Basic log channel: <#${logChannel.id}>`,
                `- Mod log channel: ${modLogChannel ? `<#${modLogChannel.id}>` : 'Not specified'}`,
            ].join('\n')
        ).setTitle('/logging setup command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return EmbedGenerator.basicEmbed(
            [
                '🔒 | The logging system has been enabled!',
                '',
                `• Basic Logging Channel Updated: <#${logChannel.id}>`,
                `• Moderator Logging Channel Updated: ${
                    modLogChannel ? `<#${modLogChannel.id}>` : 'Not Specified.'
                }`,
            ].join('\n')
        );
    },
};
