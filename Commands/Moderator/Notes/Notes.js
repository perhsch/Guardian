const Discord = require('discord.js');

const NotesView = require('./Notes.view');
const NotesAdd = require('./Notes.add');
const NotesRemove = require('./Notes.remove');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('notes')
        .setDescription('Moderator notes system for tracking users.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(NotesView.data)
        .addSubcommand(NotesAdd.data)
        .addSubcommand(NotesRemove.data),
    subCommands: [NotesView, NotesAdd, NotesRemove],
};
