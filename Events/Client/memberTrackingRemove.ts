import * as Discord from 'discord.js';

import { removeGuild } from '../../Functions/memberTracking.ts';

export default {
    name: 'guildDelete',
    /**
     * @param {Discord.Guild} guild
     * @param {Discord.Client} client
     */
    async execute(guild: Discord.Guild, _client: Discord.Client) {

        await removeGuild(guild);
    },
};
