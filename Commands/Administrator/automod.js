const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

function buildAutomodEmbed(dbGuild) {
    const doc = dbGuild?.document || {};
    const antiraid = doc.antiraid || {};
    const automod = doc.automod || {};
    const antiZalgo = automod.antiZalgo || {};
    const antiBadwords = automod.antiBadwords || {};
    const antiNuke = automod.antiNuke || {};
    const antiAd = automod.antiAdvertisement || {};

    const status = (enabled) => (enabled ? '✅ Enabled' : '❌ Disabled');

    const fields = [
        {
            name: '🛡️ Anti Raid',
            value: [
                status(antiraid.enabled),
                antiraid.enabled
                    ? `Threshold: \`${antiraid.joinAmount || '?'} joins / ${antiraid.joinWithin || '?'}s\`\nAction: \`${antiraid.action || 'none'}\` | Lockdown: ${antiraid.lockdown?.enabled ? 'Yes' : 'No'}`
                    : 'Prevents mass joins during raids.',
        ].join('\n'),
            inline: true,
        },
        {
            name: '🔤 Anti Zalgo',
            value: [
                status(antiZalgo.enabled),
                antiZalgo.enabled ? `Action: \`${antiZalgo.action || 'delete'}\`` : 'Blocks corrupted/glitchy text.',
            ].join('\n'),
            inline: true,
        },
        {
            name: '🚫 Anti Badwords',
            value: [
                status(antiBadwords.enabled),
                antiBadwords.enabled
                    ? `Words: \`${(antiBadwords.words || []).length}\` | Action: \`${antiBadwords.action || 'delete'}\``
                    : 'Filters configured bad words.',
            ].join('\n'),
            inline: true,
        },
        {
            name: '💣 Anti Nuke',
            value: [
                status(antiNuke.enabled),
                antiNuke.enabled
                    ? `Max: \`${antiNuke.maxChannelsPerMinute || 3} channels / ${antiNuke.maxRolesPerMinute || 3} roles\` per min\nAction: \`${antiNuke.action || 'ban'}\``
                    : 'Prevents mass channel/role deletion.',
            ].join('\n'),
            inline: true,
        },
        {
            name: '📢 Anti Advertisement',
            value: [
                status(antiAd.enabled),
                antiAd.enabled
                    ? `Action: \`${antiAd.action || 'delete'}\` | Whitelist: \`${(antiAd.whitelistChannels || []).length} channels\``
                    : 'Blocks Discord invite links.',
            ].join('\n'),
            inline: true,
        },
    ];

    return EmbedGenerator.basicEmbed(null)
        .setTitle('🛡️ Automod Configuration')
        .setDescription(
            'Configure your server\'s automatic moderation systems. Click **Configure** to change settings.'
        )
        .addFields(fields)
        .setFooter({ text: 'Use the Configure button below to change settings' });
}

function getAutomodComponents(dbGuild) {
    return [
        new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('automod_configure')
                .setLabel('Configure Automod')
                .setEmoji('⚙️')
                .setStyle(Discord.ButtonStyle.Primary)
        ),
    ];
}

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure automod: Anti Raid, Anti Zalgo, Anti Badwords, Anti Nuke, Anti Advertisement.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    category: 'administrator',
    buildAutomodEmbed,
    getAutomodComponents,
    async execute(interaction, client, dbGuild) {
        const embed = buildAutomodEmbed(dbGuild);
        const components = getAutomodComponents(dbGuild);
        return {
            embeds: [embed],
            components,
        };
    },
};
