import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the suggestion system.'),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/suggestion disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.suggestion.enabled = false;
        dbGuild.suggestion.reactions = false;

        return { embeds: [EmbedGenerator.basicEmbed('The Suggestion system has been disabled.')] };
    },
};
