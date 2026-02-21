const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Enable and configure the suggestion system.')
        .addBooleanOption((option) =>
            option
                .setName('add_reactions')
                .setDescription('Whether or not to add upvote & downvote reactions to suggestions.')
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const reactions = interaction.options.getBoolean('add_reactions') || false;

        if (!dbGuild.suggestion.channel) {
            return EmbedGenerator.errorEmbed(
                'Suggestion channel is not set. Please set the suggestion channel in the main admin setup command first.'
            );
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

        return EmbedGenerator.basicEmbed('The Suggestion system has been enabled.');
    },
};
