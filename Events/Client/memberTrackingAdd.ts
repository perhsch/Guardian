import * as Discord from 'discord.js';

import { addGuild } from '../../Functions/memberTracking.ts';

export default {
    name: 'guildCreate',
    /**
     * @param {Discord.Guild} guild
     * @param {Discord.Client} client
     */
    async execute(guild: Discord.Guild, _client: Discord.Client) {
        const fetchedGuild = await guild.fetch();
        await addGuild(fetchedGuild);
    },
};
