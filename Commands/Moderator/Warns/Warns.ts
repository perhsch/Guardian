import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import WarnsView from './Warns.view.ts';
import WarnsRemoveLog from './Warns.removelog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('warns')
        .setDescription('Warn logging system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(WarnsView.data)
        .addSubcommand(WarnsRemoveLog.data),
    subCommands: [WarnsView, WarnsRemoveLog],
};
