import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import NotesView from './Notes.view.ts';
import NotesAdd from './Notes.add.ts';
import NotesRemove from './Notes.remove.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('notes')
        .setDescription('Moderator notes system for tracking users.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(NotesView.data)
        .addSubcommand(NotesAdd.data)
        .addSubcommand(NotesRemove.data),
    subCommands: [NotesView, NotesAdd, NotesRemove],
};
