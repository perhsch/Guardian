import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import TicketAdminSetup from './TicketAdmin.setup.ts';
import TicketAdminDisable from './TicketAdmin.disable.ts';
import TicketAdminResendPanel from './TicketAdmin.resendPanel.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('ticket_admin')
        .setDescription('Ticket system management.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addSubcommand(TicketAdminSetup.data)
        .addSubcommand(TicketAdminDisable.data)
        .addSubcommand(TicketAdminResendPanel.data),
    subCommands: [TicketAdminSetup, TicketAdminDisable, TicketAdminResendPanel],
};
