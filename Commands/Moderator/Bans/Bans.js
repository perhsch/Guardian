const Discord = require('discord.js');

const BansView = require('./Bans.view');
const BansRemoveLog = require('./Bans.removelog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('bans')
        .setDescription('Ban logging system.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.BanMembers)
        .setDMPermission(false)
        .addSubcommand(BansView.data)
        .addSubcommand(BansRemoveLog.data),
    subCommands: [BansView, BansRemoveLog],
};
