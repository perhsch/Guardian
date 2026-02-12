const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Setup the suggestion system.')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Channel to send suggestion to.')
                .addChannelTypes(Discord.ChannelType.GuildText)
                .setRequired(true)
        )
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
        /** @type {Discord.TextChannel} */ const channel = interaction.options.getChannel(
            'channel',
            true
        );
        const reactions = interaction.options.getBoolean('add_reactions') || false;

        dbGuild.suggestion.enabled = true;
        dbGuild.suggestion.channel = channel.id;
        dbGuild.suggestion.reactions = reactions;

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Channel: <#${channel.id}>`,
                `- Add reactions: ${reactions}`,
            ].join('\n')
        ).setTitle('/suggestion setup command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return EmbedGenerator.basicEmbed('The Suggestion system has enabled.');
    },
};
