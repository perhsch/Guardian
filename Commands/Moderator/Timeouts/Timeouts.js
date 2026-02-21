const Discord = require('discord.js');

const TimeoutsView = require('./Timeouts.view');
const TimeoutsRemoveLog = require('./Timeouts.removelog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('timeouts')
        .setDescription('Timeout logging system.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(TimeoutsView.data)
        .addSubcommand(TimeoutsRemoveLog.data),
    subCommands: [TimeoutsView, TimeoutsRemoveLog],
};
