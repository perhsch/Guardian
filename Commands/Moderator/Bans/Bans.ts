import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import BansView from './Bans.view.ts';
import BansRemoveLog from './Bans.removelog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('bans')
        .setDescription('Ban logging system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false)
        .addSubcommand(BansView.data)
        .addSubcommand(BansRemoveLog.data),
    subCommands: [BansView, BansRemoveLog],
};
