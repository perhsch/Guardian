import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import TicketClose from './Ticket.close.ts';
import TicketBlock from './Ticket.block.ts';
import TicketUnblock from './Ticket.unblock.ts';
import TicketViewPrevious from './Ticket.viewPrevious.ts';
import TicketAddUser from './Ticket.addUser.ts';
import TicketRemoveUser from './Ticket.removeUser.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addSubcommand(TicketClose.data)
        .addSubcommand(TicketBlock.data)
        .addSubcommand(TicketUnblock.data)
        .addSubcommand(TicketViewPrevious.data)
        .addSubcommand(TicketAddUser.data)
        .addSubcommand(TicketRemoveUser.data),
    subCommands: [TicketClose, TicketBlock, TicketUnblock, TicketViewPrevious, TicketAddUser, TicketRemoveUser],
};
