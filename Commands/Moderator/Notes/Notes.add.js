const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');
const Notes = require('../../../Schemas/Notes');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('add')
        .setDescription('Add a note on a user.')
        .addStringOption((option) =>
            option
                .setName('user_id')
                .setDescription('The Discord user ID of the user to add a note for.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('content')
                .setDescription('The content of the note.')
                .setRequired(true)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const userId = interaction.options.getString('user_id', true);
        const content = interaction.options.getString('content', true);

        const note = await Notes.create({
            guild: interaction.guild.id,
            user: userId,
            content,
            author: interaction.user.id,
        });

        const targetUser = await client.users.fetch(userId).catch(() => null);
        const targetDisplay = targetUser ? `${targetUser} (\`${targetUser.tag}\` | ${userId})` : `\`${userId}\``;

        const modEmbed = EmbedGenerator.basicEmbed()
            .setColor('Blue')
            .setTitle('Note added')
            .setDescription(
                [
                    `**Target user**: ${targetDisplay}`,
                    `**Added by**: ${interaction.user} (\`${interaction.user.tag}\`)`,
                    `**Note ID**: \`${note.noteId}\``,
                    `**Content**: ${content}`,
                ].join('\n')
            )
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await sendModLog(interaction.guild, dbGuild, modEmbed);

        return EmbedGenerator.basicEmbed(
            `Note added. Use note ID \`${note.noteId}\` to remove this note later.`
        );
    },
};
