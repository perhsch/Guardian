import {
    Guild,
} from 'discord.js';
import GuildsModel from '../../Schemas/Guilds.ts';

export default {
    name: 'guildUpdate',
    async execute(oldGuild: Guild, newGuild: Guild) {
        try {
            // Check if the guild name has changed
            if (oldGuild.name !== newGuild.name) {
                // Update the guild name in the database
                await GuildsModel.updateOne(
                    { guild: newGuild.id },
                    { 
                        $set: { 
                            guildName: newGuild.name 
                        } 
                    }
                ).catch((error) => {
                    console.error(`Failed to update guild name for ${newGuild.id}:`, error);
                });

                console.log(`📝 Guild name updated: "${oldGuild.name}" → "${newGuild.name}" (${newGuild.id})`);
            }
        } catch (error) {
            console.error('Error in guildUpdate event:', error);
        }
    },
};
