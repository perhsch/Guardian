const { ChatInputCommandInteraction, SlashCommandBuilder, Client } = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDMPermission(false)
        .setDescription('Ping pong!'),
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    execute(interaction, client) {
        return { content: 'Pong!', ephemeral: true };
    },
};
