import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import VerificationSetup from './Verification.setup.ts';
import VerificationDisable from './Verification.disable.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('verification')
        .setDescription('Verification system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addSubcommand(VerificationSetup.data)
        .addSubcommand(VerificationDisable.data),
    subCommands: [VerificationSetup, VerificationDisable],
};
