const Discord = require('discord.js');

const LoggingSetup = require('./Logging.setup');
const LoggingDisable = require('./Logging.disable');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('logging')
        .setDescription('Logging system.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ViewAuditLog)
        .setDMPermission(false)
        .addSubcommand(LoggingSetup.data)
        .addSubcommand(LoggingDisable.data),
    subCommands: [LoggingSetup, LoggingDisable],
};
