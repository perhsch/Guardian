import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Enable and configure the suggestion system.')
        .addBooleanOption((option) =>
            option
                .setName('add_reactions')
                .setDescription('Whether or not to add upvote & downvote reactions to suggestions.')
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const reactions = interaction.options.getBoolean('add_reactions') ?? false;

        if (!dbGuild.suggestion.channel) {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'Suggestion channel is not set. Please set the suggestion channel in the main admin setup command first.'
                    ),
                ],
                ephemeral: true,
            };
        }

        dbGuild.suggestion.enabled = true;
        dbGuild.suggestion.reactions = reactions;

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Channel: <#${dbGuild.suggestion.channel}>`,
                `- Add reactions: ${reactions}`,
            ].join('\n')
        ).setTitle('/suggestion setup command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return { embeds: [EmbedGenerator.basicEmbed('The Suggestion system has been enabled.')] };
    },
};
