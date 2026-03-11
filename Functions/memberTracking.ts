import Discord from 'discord.js';
import { GuildsManager } from '../Classes/GuildsManager.ts';

/**
 * @param {Discord.Client} client
 */
export async function fetchAllMembers(client: Discord.Client): Promise<void> {
    const guilds = await client.guilds.fetch().catch(() => null);
    if (!guilds) {
        // Add a delay before retrying to prevent infinite recursion
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await fetchAllMembers(client);
    }

    const fetchedGuilds: Discord.Guild[] = [];
    for (const guild of guilds.values()) {
        const fetchedGuild = await guild.fetch().catch((e) => {
            console.log(e.stack);
            return null;
        });
        if (fetchedGuild) fetchedGuilds.push(fetchedGuild);
    }

    for (const guild of fetchedGuilds) await addGuild(guild);
}

/**
 * @param {Discord.Guild} guild
 * @param {number} retries
 */
export async function addGuild(guild: Discord.Guild, retries = 0): Promise<void> {
    // Check if guild.members exists and has fetch method
    if (!guild.members || typeof guild.members.fetch !== 'function') {
        return;
    }

    const members = await guild.members.fetch().catch((e) => {
        return null;
    });

    if (!members) {
        if (retries >= 5) {
            return;
        }
        return await addGuild(guild, retries + 1);
    }

    const dbGuild = await GuildsManager.fetch(guild.id);
    dbGuild.members = [...members.keys()];

}

/**
 * @param {Discord.Guild} guild
 */
export async function removeGuild(guild: Discord.Guild): Promise<void> {
    const dbGuild = await GuildsManager.fetch(guild.id);

    dbGuild.members = [];
}

/**
 * @param {Discord.GuildMember | Discord.PartialGuildMember} member
 */
export async function addMember(member: Discord.GuildMember | Discord.PartialGuildMember): Promise<void> {
    const dbGuild = await GuildsManager.fetch(member.guild.id);
    if (!dbGuild.members.includes(member.id)) {
        const members = dbGuild.members;
        members.push(member.id);
        dbGuild.members = members;
    }

}

/**
 * @param {Discord.GuildMember | Discord.PartialGuildMember} member
 */
export async function removeMember(member: Discord.GuildMember | Discord.PartialGuildMember): Promise<void> {
    const dbGuild = await GuildsManager.fetch(member.guild.id);
    dbGuild.members = dbGuild.members.filter((id) => id !== member.id);

}
