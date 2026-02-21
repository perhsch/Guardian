const { SlashCommandBuilder, Client, ChatInputCommandInteraction } = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('support')
        .setDMPermission(false)
        .setDescription('Sends an invite to the support server'),
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    execute(interaction, client) {
        return EmbedGenerator.basicEmbed(
            '[Click me for the support server invite!](https://discord.gg/5nWZ8BJae4)'
        );
    },
};
