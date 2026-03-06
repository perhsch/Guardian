import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import LoggingSetup from './Logging.setup.ts';
import LoggingDisable from './Logging.disable.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('logging')
        .setDescription('Logging system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
        .setDMPermission(false)
        .addSubcommand(LoggingSetup.data)
        .addSubcommand(LoggingDisable.data),
    subCommands: [LoggingSetup, LoggingDisable],
};
