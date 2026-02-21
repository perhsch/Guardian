const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');
const Notes = require('../../../Schemas/Notes');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('Remove a note from a user using the note ID.')
        .addStringOption((option) =>
            option
                .setName('user_id')
                .setDescription('The Discord user ID of the user the note belongs to.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('note_id')
                .setDescription('The unique note ID (shown when viewing or adding notes).')
                .setRequired(true)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const userId = interaction.options.getString('user_id', true);
        const noteId = interaction.options.getString('note_id', true);

        const note = await Notes.findOneAndDelete({
            guild: interaction.guild.id,
            user: userId,
            noteId: noteId,
        });

        if (!note) {
            return { embeds: [EmbedGenerator.errorEmbed('Note not found. Check the user ID and note ID.')], ephemeral: true };
        }

        const targetUser = await client.users.fetch(userId).catch(() => null);
        const targetDisplay = targetUser ? `${targetUser} (\`${targetUser.tag}\` | ${userId})` : `\`${userId}\``;

        const modEmbed = EmbedGenerator.basicEmbed()
            .setColor('Orange')
            .setTitle('Note removed')
            .setDescription(
                [
                    `**Target user**: ${targetDisplay}`,
                    `**Removed by**: ${interaction.user} (\`${interaction.user.tag}\`)`,
                    `**Note ID**: \`${noteId}\``,
                    `**Content (removed)**: ${note.content}`,
                ].join('\n')
            )
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await sendModLog(interaction.guild, dbGuild, modEmbed);

        return EmbedGenerator.basicEmbed('Note removed.');
    },
};
