import Discord from 'discord.js';
import { removeMember } from '../../Functions/memberTracking.ts';

export default {
    name: 'guildMemberRemove',
    /**
     * @param {Discord.GuildMember | Discord.PartialGuildMember} member
     * @param {Discord.Client} client
     */
    async execute(
        member: Discord.GuildMember | Discord.PartialGuildMember,
        client: Discord.Client
    ) {
        await removeMember(member);
    },
};
