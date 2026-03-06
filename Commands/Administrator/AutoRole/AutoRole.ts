import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import AutoRoleSetup from './AutoRole.setup.ts';
import AutoRoleDisable from './AutoRole.disable.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Autorole system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addSubcommand(AutoRoleSetup.data)
        .addSubcommand(AutoRoleDisable.data),
    subCommands: [AutoRoleSetup, AutoRoleDisable],
};
