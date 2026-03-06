import Discord from 'discord.js';
import { handleRaidButtonInteraction } from '../../Functions/crossServerRaidAlert.ts';

export default {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     * @param {Discord.Client} client
     */
    async execute(interaction: Discord.Interaction, client: Discord.Client) {
        if (!interaction.isButton()) return;

        // Check if this is a raid-related button interaction
        if (!interaction.customId.startsWith('raid_')) return;

        await handleRaidButtonInteraction(interaction as Discord.ButtonInteraction, client);
    },
};
