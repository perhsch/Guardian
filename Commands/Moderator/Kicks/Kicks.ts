import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import KicksView from './Kicks.view.ts';
import KicksRemoveLog from './Kicks.removelog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('kicks')
        .setDescription('Kick logging system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false)
        .addSubcommand(KicksView.data)
        .addSubcommand(KicksRemoveLog.data),
    subCommands: [KicksView, KicksRemoveLog],
};
