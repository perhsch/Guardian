const Discord = require('discord.js');

const TicketAdminSetup = require('./TicketAdmin.setup');
const TicketAdminDisable = require('./TicketAdmin.disable');
const TicketAdminResendPanel = require('./TicketAdmin.resendPanel');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('ticket_admin')
        .setDescription('Ticket system management.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addSubcommand(TicketAdminSetup.data)
        .addSubcommand(TicketAdminDisable.data)
        .addSubcommand(TicketAdminResendPanel.data),
    subCommands: [TicketAdminSetup, TicketAdminDisable, TicketAdminResendPanel],
};
