import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    ChannelType,
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';
import Guilds from '../../../Schemas/Guilds.ts';
// @ts-ignore
import emojisConfig from '../../../Config/emojis.json' assert { type: 'json' };

const emojis = emojisConfig.emojis;

export default {
    data: new SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Configure the logging system.')
        .addChannelOption((option) =>
            option
                .setName('basic_logs')
                .setDescription('Select the basic logging channel for this system.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addChannelOption((option) =>
            option
                .setName('modlog_channel')
                .setDescription('Select the moderator logging channel for this system.')
                .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
            option
                .setName('suggestions_channel')
                .setDescription('Optional: default channel for suggestions (/suggest).')
                .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
            option
                .setName('announcement_channel')
                .setDescription('Optional: default channel for announcements (/announce).')
                .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
            option
                .setName('giveaway_channel')
                .setDescription('Optional: default channel for giveaways.')
                .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
            option
                .setName('global_channel')
                .setDescription('Optional: global logging channel for all bot events.')
                .addChannelTypes(ChannelType.GuildText)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const logChannel = interaction.options.getChannel('basic_logs', true);
        const modLogChannel = interaction.options.getChannel('modlog_channel');
        const suggestionsChannel = interaction.options.getChannel('suggestions_channel');
        const announcementChannel = interaction.options.getChannel('announcement_channel');
        const giveawayChannel = interaction.options.getChannel('giveaway_channel');
        const globalChannel = interaction.options.getChannel('global_channel');

        dbGuild.logs.enabled = true;
        dbGuild.logs.basic_logs = logChannel.id;
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
            basic_logs: logChannel.id,
            moderator: modLogChannel?.id ?? null,
            global: globalChannel?.id ?? null,
            suggestionsChannel: suggestionsChannel?.id ?? null,
            announcementChannel: announcementChannel?.id ?? null,
            giveawayChannel: giveawayChannel?.id ?? null,
        };
        await Guilds.updateOne({ guild: interaction.guildId }, { $set: { logs: logsPayload } });

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
        ].filter(Boolean) as string[];

        const logEmbed = EmbedGenerator.basicEmbed(lines.join('\n')).setTitle(
            '/logging setup command used'
        );
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        const replyLines = [
            `${emojis.logging?.basiclogs || '🔒'} | The logging system has been enabled!`,
            '',
            `• Basic Logging Channel: <#${logChannel.id}>`,
            `• Moderator Logging Channel: ${modLogChannel ? `<#${modLogChannel.id}>` : 'Not specified'}`,
            `• Global Logging Channel: ${globalChannel ? `<#${globalChannel.id}>` : 'Not specified'}`,
            suggestionsChannel ? `• Suggestions Channel: <#${suggestionsChannel.id}>` : null,
            announcementChannel ? `• Announcement Channel: <#${announcementChannel.id}>` : null,
            giveawayChannel ? `• Giveaway Channel: <#${giveawayChannel.id}>` : null,
        ].filter(Boolean) as string[];

        return { embeds: [EmbedGenerator.basicEmbed(replyLines.join('\n'))] };
    },
};
