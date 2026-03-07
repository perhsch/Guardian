import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import TimeoutsView from './Timeouts.view.ts';
import TimeoutsRemoveLog from './Timeouts.removelog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('timeouts')
        .setDescription('Timeout logging system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(TimeoutsView.data)
        .addSubcommand(TimeoutsRemoveLog.data),
    subCommands: [TimeoutsView, TimeoutsRemoveLog],
};
