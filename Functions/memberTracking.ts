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

    console.log(
        `[Member Tracking]: Succesfully fetched ${fetchedGuilds.length}/${guilds.size} guilds`
    );
    for (const guild of fetchedGuilds) await addGuild(guild);
}

/**
 * @param {Discord.Guild} guild
 * @param {number} retries
 */
export async function addGuild(guild: Discord.Guild, retries = 0): Promise<void> {
    // Check if guild.members exists and has fetch method
    if (!guild.members || typeof guild.members.fetch !== 'function') {
        console.log(
            `[Member Tracking]: guild.members.fetch is not available for guild ${guild.id}`
        );
        return;
    }

    const members = await guild.members.fetch().catch((e) => {
        console.log(`[Member Tracking]: Failed to fetch members for guild ${guild.id}:`, e.message);
        return null;
    });

    if (!members) {
        if (retries >= 5) {
            console.log(
                `[Member Tracking]: Hit max retries while indexing ${guild.id}, error shown above`
            );
            return;
        }
        return await addGuild(guild, retries + 1);
    }

    const dbGuild = await GuildsManager.fetch(guild.id);
    dbGuild.members = [...members.keys()];

    console.log(`[Member Tracking]: Added guild ${guild.id} with ${members.size} members`);
}

/**
 * @param {Discord.Guild} guild
 */
export async function removeGuild(guild: Discord.Guild): Promise<void> {
    const dbGuild = await GuildsManager.fetch(guild.id);
    console.log(
        `[Member Tracking]: Removed guild ${guild.id} with ${dbGuild.members.length} members`
    );

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

    console.log(`[Member Tracking]: Added member ${member.id} from guild ${member.guild.id}`);
}

/**
 * @param {Discord.GuildMember | Discord.PartialGuildMember} member
 */
export async function removeMember(member: Discord.GuildMember | Discord.PartialGuildMember): Promise<void> {
    const dbGuild = await GuildsManager.fetch(member.guild.id);
    dbGuild.members = dbGuild.members.filter((id) => id !== member.id);

    console.log(`[Member Tracking]: Removed member ${member.id} from guild ${member.guild.id}`);
}
