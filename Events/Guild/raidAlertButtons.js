const Discord = require('discord.js');
const { handleRaidButtonInteraction } = require('../../Functions/crossServerRaidAlert');

module.exports = {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     * @param {Discord.Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        // Check if this is a raid-related button interaction
        if (!interaction.customId.startsWith('raid_')) return;

        await handleRaidButtonInteraction(interaction, client);
    },
};
