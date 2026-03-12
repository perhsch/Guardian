import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';
// @ts-ignore — Notes schema may not have types
import Notes from '../../../Schemas/Notes.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
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

    async execute(interaction: ChatInputCommandInteraction, client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const userId = interaction.options.getString('user_id', true);
        const noteId = interaction.options.getString('note_id', true);

        const note = await Notes.findOneAndDelete({
            guild: interaction.guild.id,
            user: userId,
            noteId,
        });

        if (!note) {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed('Note not found. Check the user ID and note ID.'),
                ],
                ephemeral: true,
            };
        }

        const targetUser = await client.users.fetch(userId).catch(() => null);
        const targetDisplay = targetUser
            ? `${targetUser} (\`${targetUser.tag}\` | ${userId})`
            : `\`${userId}\``;

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
            .setFooter({
                text: interaction.guild.name,
                iconURL: interaction.guild.iconURL() ?? undefined,
            })
            .setTimestamp();

        await sendModLog(interaction.guild, dbGuild, modEmbed);
        return { embeds: [EmbedGenerator.basicEmbed('Note removed.')] };
    },
};
