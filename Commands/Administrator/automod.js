const Discord = require('discord.js');
const EmbedGenerator = require('../../Functions/embedGenerator');
const Guilds = require('../../Schemas/Guilds');

const AUTOMOD_PATHS = {
    antiraid: 'antiraid',
    antiZalgo: 'automod.antiZalgo',
    antiBadwords: 'automod.antiBadwords',
    antiNuke: 'automod.antiNuke',
    antiAdvertisement: 'automod.antiAdvertisement',
    antiCaps: 'automod.antiCaps',
    antiMentionSpam: 'automod.antiMentionSpam',
    antiSpam: 'automod.antiSpam',
};

function isAutomodEnabled(doc, feature) {
    const path = AUTOMOD_PATHS[feature];
    if (!path) return false;
    const val = path.split('.').reduce((o, k) => o?.[k], doc || {});
    const schemaPath = Guilds.schema.path(path + '.enabled');
    const defaultEnabled = schemaPath?.defaultValue ?? false;
    return (val?.enabled ?? defaultEnabled) === true;
}

function buildAutomodEmbed(dbGuild, interaction = null) {
    const doc = dbGuild?.document || {};
    const antiraid = doc.antiraid || {};
    const automod = doc.automod || {};
    const antiZalgo = automod.antiZalgo || {};
    const antiBadwords = automod.antiBadwords || {};
    const antiNuke = automod.antiNuke || {};
    const antiAd = automod.antiAdvertisement || {};

    const status = (enabled) => (enabled ? '`🟢 ENABLED`' : '`🔴 DISABLED`');

    function prettyAntiraid() {
        if (!isAutomodEnabled(doc, 'antiraid')) {
            return [
                '**Status:** ' + status(false),
                '> Prevents mass joins during raids.',
                '',
                '`Configure this to secure your community from join attacks.`',
            ].join('\n');
        }

        return [
            '**Status:** ' + status(true),
            `**Threshold:** \`${antiraid.joinAmount || '?'}\` users in \`${antiraid.joinWithin || '?'}\`s`,
            `**Action:** \`${antiraid.action || 'none'}\` | **Lockdown:** ${antiraid.lockdown?.enabled ? '`ACTIVE`' : '`INACTIVE`'}`,
            '',
            `${antiraid.notice ? `> Notice: ${antiraid.notice}` : ''}`,
        ].join('\n');
    }
    function prettyAntiZalgo() {
        if (!isAutomodEnabled(doc, 'antiZalgo')) {
            return [
                '**Status:** ' + status(false),
                '> Blocks corrupted or glitchy text (Zalgo).',
            ].join('\n');
        }
        return [
            '**Status:** ' + status(true),
            `**Action:** \`${antiZalgo.action || 'delete'}\``,
            '',
        ].join('\n');
    }
    function prettyAntiBadwords() {
        if (!isAutomodEnabled(doc, 'antiBadwords')) {
            return [
                '**Status:** ' + status(false),
                '> Filters and blocks configured bad words.',
            ].join('\n');
        }
        return [
            '**Status:** ' + status(true),
            `**Words Blocked:** \`${(antiBadwords.words || []).length}\``,
            `**Action:** \`${antiBadwords.action || 'delete'}\``,
        ].join('\n');
    }
    function prettyAntiNuke() {
        if (!isAutomodEnabled(doc, 'antiNuke')) {
            return [
                '**Status:** ' + status(false),
                '> Prevents mass deletion of channels/roles.',
            ].join('\n');
        }
        return [
            '**Status:** ' + status(true),
            `**Max/Min:** \`${antiNuke.maxChannelsPerMinute || 3}\` channels / \`${antiNuke.maxRolesPerMinute || 3}\` roles/min`,
            `**Action:** \`${antiNuke.action || 'ban'}\``,
        ].join('\n');
    }
    function prettyAntiAd() {
        if (!isAutomodEnabled(doc, 'antiAdvertisement')) {
            return [
                '**Status:** ' + status(false),
                '> Blocks Discord invite links/advertising.',
            ].join('\n');
        }
        const wl = antiAd.whitelistChannels || [];
        return [
            '**Status:** ' + status(true),
            `**Action:** \`${antiAd.action || 'delete'}\``,
            `**Whitelisted Channels:** \`${wl.length}\``,
        ].join('\n');
    }
    function prettyAntiCaps() {
        if (!isAutomodEnabled(doc, 'antiCaps')) {
            return ['**Status:** ' + status(false), '> Detects excessive capitalization.'].join(
                '\n'
            );
        }
        const antiCaps = automod.antiCaps || {};
        return [
            '**Status:** ' + status(true),
            `**Threshold:** \`${antiCaps.threshold || 70}%\` caps`,
            `**Min Length:** \`${antiCaps.minLength || 10}\` chars`,
            `**Action:** \`${antiCaps.action || 'delete'}\``,
        ].join('\n');
    }
    function prettyAntiMentionSpam() {
        if (!isAutomodEnabled(doc, 'antiMentionSpam')) {
            return [
                '**Status:** ' + status(false),
                '> Limits mass mentions (@everyone/@here/@user).',
            ].join('\n');
        }
        const antiMentionSpam = automod.antiMentionSpam || {};
        return [
            '**Status:** ' + status(true),
            `**Max Mentions:** \`${antiMentionSpam.maxMentions || 5}\` per message`,
            `**Check @everyone:** ${antiMentionSpam.checkEveryone ? '`YES`' : '`NO`'}`,
            `**Action:** \`${antiMentionSpam.action || 'delete'}\``,
        ].join('\n');
    }
    function prettyAntiSpam() {
        if (!isAutomodEnabled(doc, 'antiSpam')) {
            return [
                '**Status:** ' + status(false),
                '> Detects rapid message sending and duplicates.',
            ].join('\n');
        }
        const antiSpam = automod.antiSpam || {};
        return [
            '**Status:** ' + status(true),
            `**Max Messages:** \`${antiSpam.maxMessages || 5}\` in \`${(antiSpam.timeframe || 5000) / 1000}s\``,
            `**Max Duplicates:** \`${antiSpam.maxDuplicates || 3}\``,
            `**Action:** \`${antiSpam.action || 'delete'}\``,
        ].join('\n');
    }

    const overview = [
        '```ansi',
        '\u001b[1;36mGuardian Automod Overview\u001b[0m',
        '```',
        '',
        "**🛡️  Automod is your Discord server's automatic guardian!**",
        '— Protects your community 24/7 against common threats and spam.',
        '',
        '**Systems Enabled:**',
        `> 🛡️ Anti Raid      —   ${status(isAutomodEnabled(doc, 'antiraid'))}`,
        `> 🔤 Anti Zalgo     —   ${status(isAutomodEnabled(doc, 'antiZalgo'))}`,
        `> 🚫 Anti Badwords  —   ${status(isAutomodEnabled(doc, 'antiBadwords'))}`,
        `> 💣 Anti Nuke      —   ${status(isAutomodEnabled(doc, 'antiNuke'))}`,
        `> 📢 Anti Ad        —   ${status(isAutomodEnabled(doc, 'antiAdvertisement'))}`,
        `> 🔠 Anti Caps      —   ${status(isAutomodEnabled(doc, 'antiCaps'))}`,
        `> 🏷️ Anti Mentions  —   ${status(isAutomodEnabled(doc, 'antiMentionSpam'))}`,
        `> 📧 Anti Spam      —   ${status(isAutomodEnabled(doc, 'antiSpam'))}`,
        '',
    ].join('\n');

    const embed = EmbedGenerator.basicEmbed(null)
        .setAuthor({
            name: interaction?.guild?.name
                ? `Automod Configuration for ${interaction.guild.name}`
                : 'Automod Configuration',
            iconURL: interaction?.guild?.iconURL?.() || undefined,
        })
        .setTitle('🛡️ AUTOMOD CONTROL DASHBOARD')
        .setColor(0x14b089)
        .setDescription(overview)
        .addFields([
            {
                name: '🛡️ Anti Raid',
                value: prettyAntiraid(),
                inline: false,
            },
            {
                name: '🔤 Anti Zalgo',
                value: prettyAntiZalgo(),
                inline: true,
            },
            {
                name: '🚫 Anti Badwords',
                value: prettyAntiBadwords(),
                inline: true,
            },
            {
                name: '💣 Anti Nuke',
                value: prettyAntiNuke(),
                inline: true,
            },
            {
                name: '📢 Anti Advertisement',
                value: prettyAntiAd(),
                inline: true,
            },
            {
                name: '🔠 Anti Caps',
                value: prettyAntiCaps(),
                inline: true,
            },
            {
                name: '🏷️ Anti Mentions',
                value: prettyAntiMentionSpam(),
                inline: true,
            },
            {
                name: '📧 Anti Spam',
                value: prettyAntiSpam(),
                inline: true,
            },
        ])
        .setFooter({
            text: '⚙️  Click "Configure Automod" below to change settings and keep your server secure!',
        })
        .setTimestamp();

    embed.addFields([
        {
            name: 'ℹ️  Quick Legend',
            value: [
                '`🟢 Enabled` = Feature Active   |   `🔴 Disabled` = Feature Off',
                'Update settings anytime with `/automod` or click “Configure Automod” below.',
            ].join('\n'),
            inline: false,
        },
    ]);
    return embed;
}

function getAutomodComponents() {
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
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure automod protection systems for your server.')
        .setDefaultMemberPermissions(
            Discord.PermissionFlagsBits.ManageRoles |
                Discord.PermissionFlagsBits.ManageChannels |
                Discord.PermissionFlagsBits.ModerateMembers
        )
        .setDMPermission(false),
    category: 'administrator',
    buildAutomodEmbed,
    getAutomodComponents,
    async execute(interaction, client, dbGuild) {
        const embed = buildAutomodEmbed(dbGuild, interaction);
        const components = getAutomodComponents();
        return {
            embeds: [embed],
            components,
        };
    },
};
