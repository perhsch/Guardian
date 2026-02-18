const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { GuildsManager } = require('../../Classes/GuildsManager');
const { sendModLog } = require('../../Functions/modLog');
const Infractions = require('../../Schemas/Infractions');

const ZALGO_REGEX = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]{2,}/;

const INVITE_REGEX =
    /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li|com\/invite)|discordapp\.com\/invite)\/([\w-]{2,255})/i;

function containsZalgo(content) {
    return ZALGO_REGEX.test(content);
}

function containsInvite(content) {
    if (!content) return false;
    return INVITE_REGEX.test(content);
}

function messageContainsInvite(message) {
    if (message.content && containsInvite(message.content)) {
        return true;
    }
    
    if (message.embeds && message.embeds.length > 0) {
        for (const embed of message.embeds) {
            if (embed.description && containsInvite(embed.description)) {
                return true;
            }
            if (embed.fields && embed.fields.length > 0) {
                for (const field of embed.fields) {
                    if (field.value && containsInvite(field.value)) {
                        return true;
                    }
                    if (field.name && containsInvite(field.name)) {
                        return true;
                    }
                }
            }
            if (embed.footer && embed.footer.text && containsInvite(embed.footer.text)) {
                return true;
            }
            if (embed.author && embed.author.name && containsInvite(embed.author.name)) {
                return true;
            }
        }
    }
    
    return false;
}

function containsBadword(content, words) {
    if (!words || words.length === 0 || !content) return false;
    const lower = content.toLowerCase();
    return words.some((w) => {
        const trimmed = w.trim().toLowerCase();
        if (!trimmed) return false;
        const wordBoundaryPattern = new RegExp(`\\b${escapeRegex(trimmed)}\\b`, 'i');
        if (wordBoundaryPattern.test(lower)) return true;
        return lower.includes(trimmed);
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function executeAutomodAction(message, client, dbGuild, action, reason, system) {
    const member = message.member;
    if (!member || !member.moderatable) return;

    if (action === 'delete') {
        await message.delete().catch(() => null);
        const logEmbed = EmbedGenerator.basicEmbed(
            `**${system}**\nMessage by ${message.author} was deleted.\n**Reason:** ${reason}\n**Content:** ${message.content?.slice(0, 200) || '(empty)'}`
        )
            .setColor('Orange')
            .setTitle('Automod Action');
        await sendModLog(message.guild, dbGuild, logEmbed);
        return;
    }

    if (action === 'warn') {
        await message.delete().catch(() => null);
        const infractionEmbed = EmbedGenerator.infractionEmbed(
            message.guild,
            client.user.id,
            'Warning',
            null,
            null,
            reason
        );
        await member.send({ embeds: [infractionEmbed] }).catch(() => null);
        await Infractions.create({
            guild: message.guild.id,
            user: member.id,
            issuer: client.user.id,
            type: 'warning',
            reason: reason,
            active: false,
        });
        const logEmbed = EmbedGenerator.basicEmbed(
            `**${system}**\n${member} was warned.\n**Reason:** ${reason}\n**Content:** ${message.content?.slice(0, 200) || '(empty)'}`
        )
            .setColor('Orange')
            .setTitle('Automod Action');
        await sendModLog(message.guild, dbGuild, logEmbed);
        return;
    }

    if (action === 'timeout') {
        await message.delete().catch(() => null);
        const durationMs = 60 * 60 * 1000;
        const infractionEmbed = EmbedGenerator.infractionEmbed(
            message.guild,
            client.user.id,
            'Timeout',
            durationMs,
            Date.now() + durationMs,
            reason
        );
        await member.send({ embeds: [infractionEmbed] }).catch(() => null);
        await member.timeout(durationMs, reason).catch(() => null);
        const inf = await Infractions.create({
            guild: message.guild.id,
            user: member.id,
            issuer: client.user.id,
            type: 'timeout',
            reason: reason,
            duration: durationMs,
        });
        await client.expiringDocumentsManager.infractions.addNewDocument(inf);
        const logEmbed = EmbedGenerator.basicEmbed(
            `**${system}**\n${member} was timed out for 1h.\n**Reason:** ${reason}\n**Content:** ${message.content?.slice(0, 200) || '(empty)'}`
        )
            .setColor('Orange')
            .setTitle('Automod Action');
        await sendModLog(message.guild, dbGuild, logEmbed);
    }
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const dbGuild = await GuildsManager.fetch(message.guild.id);
        if (!dbGuild) return;

        const doc = dbGuild.document || {};
        const automod = doc.automod || {};

        const antiZalgo = automod.antiZalgo || {};
        if (antiZalgo.enabled && message.content && containsZalgo(message.content)) {
            await executeAutomodAction(
                message,
                client,
                dbGuild,
                antiZalgo.action || 'delete',
                'Zalgo/corrupted text is not allowed.',
                'Anti Zalgo'
            );
            return;
        }

        const antiBadwords = automod.antiBadwords || {};
        if (antiBadwords.enabled && message.content && containsBadword(message.content, antiBadwords.words || [])) {
            await executeAutomodAction(
                message,
                client,
                dbGuild,
                antiBadwords.action || 'delete',
                'Your message contained a word that is not allowed.',
                'Anti Badwords'
            );
            return;
        }

        const antiAd = automod.antiAdvertisement || {};
        if (antiAd.enabled && messageContainsInvite(message)) {
            const whitelist = antiAd.whitelistChannels || [];
            if (whitelist.includes(message.channel.id)) return;
            await executeAutomodAction(
                message,
                client,
                dbGuild,
                antiAd.action || 'delete',
                'Discord invite links are not allowed.',
                'Anti Advertisement'
            );
            return;
        }
    },
};
