import Discord from 'discord.js';
import { addMember } from '../../Functions/memberTracking.ts';

export default {
    name: 'guildMemberAdd',
    /**
     * @param {Discord.GuildMember} member
     * @param {Discord.Client} client
     */
    async execute(member: Discord.GuildMember, client: Discord.Client) {
        await addMember(await member.fetch());
    },
};
