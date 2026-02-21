const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    Client,
    ChatInputCommandInteraction,
} = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    developer: true,
    data: new SlashCommandBuilder()
        .setName('emit')
        .setDescription('Emit the guildMemberAdd/Remove events.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    execute(interaction, client) {
        client.emit('guildMemberRemove', interaction.member);

        interaction.reply({ content: 'Emitted GuildMemberRemove', ephemeral: true });
    },
};
