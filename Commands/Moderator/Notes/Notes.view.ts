import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import moment from 'moment';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
// @ts-ignore — Notes schema may not have types
import Notes from '../../../Schemas/Notes.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('view')
        .setDescription('View notes on a user.')
        .addStringOption((option) =>
            option.setName('user_id').setDescription('The Discord user ID of the user to view notes for.').setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client, _dbGuild: any, dbUser: any) {
        if (!interaction.guild) return;

        const userId = interaction.options.getString('user_id', true);
        const notes = await Notes.find({ guild: interaction.guild.id, user: userId }).sort({ time: -1 });

        if (notes.length === 0) {
            return { embeds: [EmbedGenerator.errorEmbed('No notes found for this user.')], ephemeral: true };
        }

        const embeds = [];
        for (let i = 0; i < notes.length; i += 8) {
            const notesSlice = notes.slice(i, i + 8);
            const embed = EmbedGenerator.basicEmbed()
                .setAuthor({ name: `Notes for ${userId}`, iconURL: interaction.guild.iconURL() ?? undefined })
                .setDescription([
                    `Total Notes: ${notes.length}`,
                    `Latest: <t:${moment(notes[0].time).unix()}:f>`,
                    '',
                    ...notesSlice.map((note: any) => `**\`${note.noteId}\`** • <@${note.author}> • <t:${moment(note.time).unix()}:R>\n${note.content}`)
                ].join('\n\n'));
            embeds.push(embed);
        }

        await EmbedGenerator.pagesEmbed(interaction, embeds, true, dbUser?.language);
    },
};
