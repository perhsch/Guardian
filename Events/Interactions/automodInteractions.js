const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { GuildsManager } = require('../../Classes/GuildsManager');
const { sendModLog } = require('../../Functions/modLog');
const Guilds = require('../../Schemas/Guilds');
const automodCommand = require('../../Commands/Administrator/automod');

const TextInputStyle = Discord.TextInputStyle;

function parseIdInput(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function buildAntiraidModal(dbGuild) {
    const ar = dbGuild?.document?.antiraid || {};
    const opt = (id, label, val, req = false) => {
        const input = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(req)
            .setMaxLength(50);
        if (val != null && val !== '') input.setValue(String(val));
        return new Discord.ActionRowBuilder().addComponents(input);
    };

    return new Discord.ModalBuilder()
        .setCustomId('automod_modal_antiraid')
        .setTitle('Anti Raid Settings')
        .addComponents(
            opt('enabled', 'Enabled (yes/no)', ar.enabled ? 'yes' : 'no'),
            opt('joinAmount', 'Joins required to trigger', ar.joinAmount ?? 5),
            opt('joinWithin', 'Within seconds', ar.joinWithin ?? 10),
            opt('action', 'Action: kick or ban', ar.action ?? 'kick'),
            opt(
                'lockdown',
                'Lockdown (yes/no). Alert channel ID optional:',
                ar.lockdown?.enabled
                    ? ar.channel
                        ? `yes, ${ar.channel}`
                        : 'yes'
                    : ar.channel
                      ? ar.channel
                      : 'no'
            )
        );
}

function buildAntiZalgoModal(dbGuild) {
    const az = dbGuild?.document?.automod?.antiZalgo || {};
    const opt = (id, label, val) => {
        const input = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(id === 'enabled')
            .setMaxLength(20);
        if (val != null && val !== '') input.setValue(String(val));
        return new Discord.ActionRowBuilder().addComponents(input);
    };

    return new Discord.ModalBuilder()
        .setCustomId('automod_modal_antizalgo')
        .setTitle('Anti Zalgo Settings')
        .addComponents(
            opt('enabled', 'Enabled (yes/no)', az.enabled ? 'yes' : 'no'),
            opt('action', 'Action: delete, warn, or timeout', az.action ?? 'delete')
        );
}

function buildAntiBadwordsModal(dbGuild) {
    const ab = dbGuild?.document?.automod?.antiBadwords || {};
    const words = (ab.words || []).join(', ');
    const input = new Discord.TextInputBuilder()
        .setCustomId('words')
        .setLabel('Bad words (comma-separated)')
        .setPlaceholder('word1, word2, word3')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(1000);
    if (words) input.setValue(words);

    const opt = (id, label, val) => {
        const i = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(20);
        if (val != null && val !== '') i.setValue(String(val));
        return new Discord.ActionRowBuilder().addComponents(i);
    };

    return new Discord.ModalBuilder()
        .setCustomId('automod_modal_antibadwords')
        .setTitle('Anti Badwords Settings')
        .addComponents(
            opt('enabled', 'Enabled (yes/no)', ab.enabled ? 'yes' : 'no'),
            new Discord.ActionRowBuilder().addComponents(input),
            opt('action', 'Action: delete, warn, or timeout', ab.action ?? 'delete')
        );
}

function buildAntiNukeModal(dbGuild) {
    const an = dbGuild?.document?.automod?.antiNuke || {};
    const opt = (id, label, val) => {
        const input = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(20);
        if (val != null && val !== '') input.setValue(String(val));
        return new Discord.ActionRowBuilder().addComponents(input);
    };

    return new Discord.ModalBuilder()
        .setCustomId('automod_modal_antinuke')
        .setTitle('Anti Nuke Settings')
        .addComponents(
            opt('enabled', 'Enabled (yes/no)', an.enabled ? 'yes' : 'no'),
            opt(
                'maxChannelsPerMinute',
                'Max channels deleted per minute',
                an.maxChannelsPerMinute ?? 3
            ),
            opt('maxRolesPerMinute', 'Max roles deleted per minute', an.maxRolesPerMinute ?? 3),
            opt('action', 'Action: kick or ban', an.action ?? 'ban')
        );
}

function buildAntiAdvertisementModal(dbGuild) {
    const aa = dbGuild?.document?.automod?.antiAdvertisement || {};
    const channels = (aa.whitelistChannels || []).join(', ');
    const input = new Discord.TextInputBuilder()
        .setCustomId('whitelistChannels')
        .setLabel('Whitelist channel IDs (comma-separated)')
        .setPlaceholder('123456789, 987654321')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500);
    if (channels) input.setValue(channels);

    const opt = (id, label, val) => {
        const i = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(20);
        if (val != null && val !== '') i.setValue(String(val));
        return new Discord.ActionRowBuilder().addComponents(i);
    };

    return new Discord.ModalBuilder()
        .setCustomId('automod_modal_antiad')
        .setTitle('Anti Advertisement Settings')
        .addComponents(
            opt('enabled', 'Enabled (yes/no)', aa.enabled ? 'yes' : 'no'),
            new Discord.ActionRowBuilder().addComponents(input),
            opt('action', 'Action: delete, warn, or timeout', aa.action ?? 'delete')
        );
}

function buildAntiCapsModal(dbGuild) {
    const ac = dbGuild?.document?.automod?.antiCaps || {};
    const opt = (id, label, val) => {
        const input = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(id === 'enabled')
            .setMaxLength(20);
        if (val != null && val !== '') input.setValue(String(val));
        return new Discord.ActionRowBuilder().addComponents(input);
    };

    return new Discord.ModalBuilder()
        .setCustomId('automod_modal_anticaps')
        .setTitle('Anti Caps Settings')
        .addComponents(
            opt('enabled', 'Enabled (yes/no)', ac.enabled ? 'yes' : 'no'),
            opt('threshold', 'Caps percentage threshold (1-100)', ac.threshold ?? 70),
            opt('minLength', 'Minimum message length', ac.minLength ?? 10),
            opt('action', 'Action: delete, warn, or timeout', ac.action ?? 'delete')
        );
}

function buildAntiMentionSpamModal(dbGuild) {
    const ams = dbGuild?.document?.automod?.antiMentionSpam || {};
    const opt = (id, label, val) => {
        const input = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(id === 'enabled')
            .setMaxLength(20);
        if (val != null && val !== '') input.setValue(String(val));
        return new Discord.ActionRowBuilder().addComponents(input);
    };

    return new Discord.ModalBuilder()
        .setCustomId('automod_modal_antimentionspam')
        .setTitle('Anti Mention Spam Settings')
        .addComponents(
            opt('enabled', 'Enabled (yes/no)', ams.enabled ? 'yes' : 'no'),
            opt('maxMentions', 'Max mentions per message', ams.maxMentions ?? 5),
            opt(
                'checkEveryone',
                'Check @everyone/@here (yes/no)',
                ams.checkEveryone ? 'yes' : 'no'
            ),
            opt('action', 'Action: delete, warn, or timeout', ams.action ?? 'delete')
        );
}

function buildAntiSpamModal(dbGuild) {
    const as = dbGuild?.document?.automod?.antiSpam || {};
    const opt = (id, label, val) => {
        const input = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(id === 'enabled')
            .setMaxLength(20);
        if (val != null && val !== '') input.setValue(String(val));
        return new Discord.ActionRowBuilder().addComponents(input);
    };

    return new Discord.ModalBuilder()
        .setCustomId('automod_modal_antispam')
        .setTitle('Anti Spam Settings')
        .addComponents(
            opt('enabled', 'Enabled (yes/no)', as.enabled ? 'yes' : 'no'),
            opt('maxMessages', 'Max messages in timeframe', as.maxMessages ?? 5),
            opt('timeframe', 'Timeframe in milliseconds', as.timeframe ?? 5000),
            opt('maxDuplicates', 'Max duplicate messages', as.maxDuplicates ?? 3),
            opt('action', 'Action: delete, warn, or timeout', as.action ?? 'delete')
        );
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isButton() && interaction.customId === 'automod_configure') {
            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [
                        EmbedGenerator.errorEmbed('Only administrators can configure automod.'),
                    ],
                    ephemeral: true,
                });
            }
            const selectRow = new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId('automod_settings_select')
                    .setPlaceholder('⚙️ Choose a system to configure...')
                    .addOptions(
                        new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Anti Raid')
                            .setValue('antiraid')
                            .setDescription('Mass join protection')
                            .setEmoji('🛡️'),
                        new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Anti Zalgo')
                            .setValue('antizalgo')
                            .setDescription('Block corrupted/glitchy text')
                            .setEmoji('🔤'),
                        new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Anti Badwords')
                            .setValue('antibadwords')
                            .setDescription('Filter bad words')
                            .setEmoji('🚫'),
                        new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Anti Nuke')
                            .setValue('antinuke')
                            .setDescription('Prevent mass channel/role deletion')
                            .setEmoji('💣'),
                        new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Anti Advertisement')
                            .setValue('antiad')
                            .setDescription('Block Discord invite links')
                            .setEmoji('📢'),
                        new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Anti Caps')
                            .setValue('anticaps')
                            .setDescription('Detect excessive capitalization')
                            .setEmoji('🔠'),
                        new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Anti Mention Spam')
                            .setValue('antimentionspam')
                            .setDescription('Limit mass mentions')
                            .setEmoji('🏷️'),
                        new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Anti Spam')
                            .setValue('antispam')
                            .setDescription('Detect rapid message sending')
                            .setEmoji('📧')
                    )
            );
            return interaction.reply({
                components: [selectRow],
                ephemeral: true,
            });
        }

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId === 'automod_settings_select'
        ) {
            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [
                        EmbedGenerator.errorEmbed('Only administrators can configure automod.'),
                    ],
                    ephemeral: true,
                });
            }
            const value = interaction.values[0];
            const dbGuild = await GuildsManager.fetch(interaction.guild.id);
            let modal;
            if (value === 'antiraid') modal = buildAntiraidModal(dbGuild);
            else if (value === 'antizalgo') modal = buildAntiZalgoModal(dbGuild);
            else if (value === 'antibadwords') modal = buildAntiBadwordsModal(dbGuild);
            else if (value === 'antinuke') modal = buildAntiNukeModal(dbGuild);
            else if (value === 'antiad') modal = buildAntiAdvertisementModal(dbGuild);
            else if (value === 'anticaps') modal = buildAntiCapsModal(dbGuild);
            else if (value === 'antimentionspam') modal = buildAntiMentionSpamModal(dbGuild);
            else if (value === 'antispam') modal = buildAntiSpamModal(dbGuild);
            else return;
            return interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('automod_modal_')) {
            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [
                        EmbedGenerator.errorEmbed('Only administrators can configure automod.'),
                    ],
                    ephemeral: true,
                });
            }

            const dbGuild = await GuildsManager.fetch(interaction.guild.id);
            const customId = interaction.customId;

            const parseBool = (v) => {
                const s = (v || '').toString().trim().toLowerCase();
                return s === 'yes' || s === 'true' || s === '1';
            };

            if (customId === 'automod_modal_antiraid') {
                const enabled = parseBool(interaction.fields.getTextInputValue('enabled'));
                const joinAmount =
                    parseInt(interaction.fields.getTextInputValue('joinAmount'), 10) || 5;
                const joinWithin =
                    parseInt(interaction.fields.getTextInputValue('joinWithin'), 10) || 10;
                const actionRaw = (interaction.fields.getTextInputValue('action') || 'kick')
                    .trim()
                    .toLowerCase();
                const action = actionRaw === 'ban' ? 'ban' : 'kick';
                const lockdownStr = (interaction.fields.getTextInputValue('lockdown') || '')
                    .trim()
                    .toLowerCase();
                const lockdown = parseBool(lockdownStr);
                let channel = dbGuild?.antiraid?.channel ?? null;
                const channelMatch = lockdownStr.match(/(\d{17,20})/);
                if (channelMatch) channel = channelMatch[1];

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'antiraid.enabled': enabled,
                            'antiraid.joinAmount': joinAmount,
                            'antiraid.joinWithin': joinWithin,
                            'antiraid.action': enabled ? action : null,
                            'antiraid.lockdown.enabled': lockdown,
                            'antiraid.channel': channel,
                        },
                    }
                );
                dbGuild.document.antiraid = dbGuild.document.antiraid || {};
                dbGuild.document.antiraid.enabled = enabled;
                dbGuild.document.antiraid.joinAmount = joinAmount;
                dbGuild.document.antiraid.joinWithin = joinWithin;
                dbGuild.document.antiraid.action = enabled ? action : null;
                dbGuild.document.antiraid.lockdown = dbGuild.document.antiraid.lockdown || {};
                dbGuild.document.antiraid.lockdown.enabled = lockdown;
                dbGuild.document.antiraid.channel = channel;

                const logEmbed = EmbedGenerator.basicEmbed(
                    `Anti Raid configured by ${interaction.user.tag}\nEnabled: ${enabled}\nJoins: ${joinAmount}/${joinWithin}s | Action: ${action} | Lockdown: ${lockdown}`
                ).setTitle('Automod: Anti Raid');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('🔒 | Anti Raid settings saved!')],
                    ephemeral: true,
                });
            }

            if (customId === 'automod_modal_antizalgo') {
                const enabled = parseBool(interaction.fields.getTextInputValue('enabled'));
                const actionRaw = (interaction.fields.getTextInputValue('action') || 'delete')
                    .trim()
                    .toLowerCase();
                const action = ['delete', 'warn', 'timeout'].includes(actionRaw)
                    ? actionRaw
                    : 'delete';

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'automod.antiZalgo.enabled': enabled,
                            'automod.antiZalgo.action': action,
                        },
                    }
                );
                if (!dbGuild.document.automod) dbGuild.document.automod = {};
                if (!dbGuild.document.automod.antiZalgo) dbGuild.document.automod.antiZalgo = {};
                dbGuild.document.automod.antiZalgo.enabled = enabled;
                dbGuild.document.automod.antiZalgo.action = action;

                const logEmbed = EmbedGenerator.basicEmbed(
                    `Anti Zalgo configured by ${interaction.user.tag}\nEnabled: ${enabled}\nAction: ${action}`
                ).setTitle('Automod: Anti Zalgo');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                try {
                    const msg = await interaction.message?.fetch?.();
                    if (msg) {
                        const embed = automodCommand.buildAutomodEmbed(dbGuild);
                        const components = automodCommand.getAutomodComponents(dbGuild);
                        await msg.edit({ embeds: [embed], components });
                    }
                } catch {}
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('🔒 | Anti Zalgo settings saved!')],
                    ephemeral: true,
                });
            }

            if (customId === 'automod_modal_antibadwords') {
                const enabled = parseBool(interaction.fields.getTextInputValue('enabled'));
                const wordsStr = interaction.fields.getTextInputValue('words') || '';
                const words = wordsStr
                    .split(',')
                    .map((w) => w.trim().toLowerCase())
                    .filter((w) => w.length > 0);
                const actionRaw = (interaction.fields.getTextInputValue('action') || 'delete')
                    .trim()
                    .toLowerCase();
                const action = ['delete', 'warn', 'timeout'].includes(actionRaw)
                    ? actionRaw
                    : 'delete';

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'automod.antiBadwords.enabled': enabled,
                            'automod.antiBadwords.words': words,
                            'automod.antiBadwords.action': action,
                        },
                    }
                );
                if (!dbGuild.document.automod) dbGuild.document.automod = {};
                if (!dbGuild.document.automod.antiBadwords)
                    dbGuild.document.automod.antiBadwords = {};
                dbGuild.document.automod.antiBadwords.enabled = enabled;
                dbGuild.document.automod.antiBadwords.words = words;
                dbGuild.document.automod.antiBadwords.action = action;

                const logEmbed = EmbedGenerator.basicEmbed(
                    `Anti Badwords configured by ${interaction.user.tag}\nEnabled: ${enabled}\nWords: ${words.length} | Action: ${action}`
                ).setTitle('Automod: Anti Badwords');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                try {
                    const msg = await interaction.message?.fetch?.();
                    if (msg) {
                        const embed = automodCommand.buildAutomodEmbed(dbGuild);
                        const components = automodCommand.getAutomodComponents(dbGuild);
                        await msg.edit({ embeds: [embed], components });
                    }
                } catch {}
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('🔒 | Anti Badwords settings saved!')],
                    ephemeral: true,
                });
            }

            if (customId === 'automod_modal_antinuke') {
                const enabled = parseBool(interaction.fields.getTextInputValue('enabled'));
                const maxChannels =
                    parseInt(interaction.fields.getTextInputValue('maxChannelsPerMinute'), 10) || 3;
                const maxRoles =
                    parseInt(interaction.fields.getTextInputValue('maxRolesPerMinute'), 10) || 3;
                const actionRaw = (interaction.fields.getTextInputValue('action') || 'ban')
                    .trim()
                    .toLowerCase();
                const action = actionRaw === 'kick' ? 'kick' : 'ban';

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'automod.antiNuke.enabled': enabled,
                            'automod.antiNuke.maxChannelsPerMinute': maxChannels,
                            'automod.antiNuke.maxRolesPerMinute': maxRoles,
                            'automod.antiNuke.action': action,
                        },
                    }
                );
                if (!dbGuild.document.automod) dbGuild.document.automod = {};
                if (!dbGuild.document.automod.antiNuke) dbGuild.document.automod.antiNuke = {};
                dbGuild.document.automod.antiNuke.enabled = enabled;
                dbGuild.document.automod.antiNuke.maxChannelsPerMinute = maxChannels;
                dbGuild.document.automod.antiNuke.maxRolesPerMinute = maxRoles;
                dbGuild.document.automod.antiNuke.action = action;

                const logEmbed = EmbedGenerator.basicEmbed(
                    `Anti Nuke configured by ${interaction.user.tag}\nEnabled: ${enabled}\nMax: ${maxChannels} channels, ${maxRoles} roles/min | Action: ${action}`
                ).setTitle('Automod: Anti Nuke');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                try {
                    const msg = await interaction.message?.fetch?.();
                    if (msg) {
                        const embed = automodCommand.buildAutomodEmbed(dbGuild);
                        const components = automodCommand.getAutomodComponents(dbGuild);
                        await msg.edit({ embeds: [embed], components });
                    }
                } catch {}
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('🔒 | Anti Nuke settings saved!')],
                    ephemeral: true,
                });
            }

            if (customId === 'automod_modal_antiad') {
                const enabled = parseBool(interaction.fields.getTextInputValue('enabled'));
                const channelsStr = interaction.fields.getTextInputValue('whitelistChannels') || '';
                const whitelistChannels = channelsStr
                    .split(',')
                    .map((c) => c.trim())
                    .filter((c) => c.length >= 17 && c.length <= 20);
                const actionRaw = (interaction.fields.getTextInputValue('action') || 'delete')
                    .trim()
                    .toLowerCase();
                const action = ['delete', 'warn', 'timeout'].includes(actionRaw)
                    ? actionRaw
                    : 'delete';

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'automod.antiAdvertisement.enabled': enabled,
                            'automod.antiAdvertisement.whitelistChannels': whitelistChannels,
                            'automod.antiAdvertisement.action': action,
                        },
                    }
                );
                if (!dbGuild.document.automod) dbGuild.document.automod = {};
                if (!dbGuild.document.automod.antiAdvertisement)
                    dbGuild.document.automod.antiAdvertisement = {};
                dbGuild.document.automod.antiAdvertisement.enabled = enabled;
                dbGuild.document.automod.antiAdvertisement.whitelistChannels = whitelistChannels;
                dbGuild.document.automod.antiAdvertisement.action = action;

                const logEmbed = EmbedGenerator.basicEmbed(
                    `Anti Advertisement configured by ${interaction.user.tag}\nEnabled: ${enabled}\nAction: ${action} | Whitelist: ${whitelistChannels.length} channels`
                ).setTitle('Automod: Anti Advertisement');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                try {
                    const msg = await interaction.message?.fetch?.();
                    if (msg) {
                        const embed = automodCommand.buildAutomodEmbed(dbGuild);
                        const components = automodCommand.getAutomodComponents(dbGuild);
                        await msg.edit({ embeds: [embed], components });
                    }
                } catch {}
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('🔒 | Anti Advertisement settings saved!')],
                    ephemeral: true,
                });
            }

            if (customId === 'automod_modal_anticaps') {
                const enabled = parseBool(interaction.fields.getTextInputValue('enabled'));
                const threshold =
                    parseInt(interaction.fields.getTextInputValue('threshold'), 10) || 70;
                const minLength =
                    parseInt(interaction.fields.getTextInputValue('minLength'), 10) || 10;
                const actionRaw = (interaction.fields.getTextInputValue('action') || 'delete')
                    .trim()
                    .toLowerCase();
                const action = ['delete', 'warn', 'timeout'].includes(actionRaw)
                    ? actionRaw
                    : 'delete';

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'automod.antiCaps.enabled': enabled,
                            'automod.antiCaps.threshold': Math.max(1, Math.min(100, threshold)),
                            'automod.antiCaps.minLength': Math.max(1, minLength),
                            'automod.antiCaps.action': action,
                        },
                    }
                );
                if (!dbGuild.document.automod) dbGuild.document.automod = {};
                if (!dbGuild.document.automod.antiCaps) dbGuild.document.automod.antiCaps = {};
                dbGuild.document.automod.antiCaps.enabled = enabled;
                dbGuild.document.automod.antiCaps.threshold = Math.max(1, Math.min(100, threshold));
                dbGuild.document.automod.antiCaps.minLength = Math.max(1, minLength);
                dbGuild.document.automod.antiCaps.action = action;

                const logEmbed = EmbedGenerator.basicEmbed(
                    `Anti Caps configured by ${interaction.user.tag}\nEnabled: ${enabled}\nThreshold: ${threshold}% | Min Length: ${minLength} | Action: ${action}`
                ).setTitle('Automod: Anti Caps');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                try {
                    const msg = await interaction.message?.fetch?.();
                    if (msg) {
                        const embed = automodCommand.buildAutomodEmbed(dbGuild);
                        const components = automodCommand.getAutomodComponents(dbGuild);
                        await msg.edit({ embeds: [embed], components });
                    }
                } catch {}
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('🔒 | Anti Caps settings saved!')],
                    ephemeral: true,
                });
            }

            if (customId === 'automod_modal_antimentionspam') {
                const enabled = parseBool(interaction.fields.getTextInputValue('enabled'));
                const maxMentions =
                    parseInt(interaction.fields.getTextInputValue('maxMentions'), 10) || 5;
                const checkEveryone = parseBool(
                    interaction.fields.getTextInputValue('checkEveryone')
                );
                const actionRaw = (interaction.fields.getTextInputValue('action') || 'delete')
                    .trim()
                    .toLowerCase();
                const action = ['delete', 'warn', 'timeout'].includes(actionRaw)
                    ? actionRaw
                    : 'delete';

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'automod.antiMentionSpam.enabled': enabled,
                            'automod.antiMentionSpam.maxMentions': Math.max(1, maxMentions),
                            'automod.antiMentionSpam.checkEveryone': checkEveryone,
                            'automod.antiMentionSpam.action': action,
                        },
                    }
                );
                if (!dbGuild.document.automod) dbGuild.document.automod = {};
                if (!dbGuild.document.automod.antiMentionSpam)
                    dbGuild.document.automod.antiMentionSpam = {};
                dbGuild.document.automod.antiMentionSpam.enabled = enabled;
                dbGuild.document.automod.antiMentionSpam.maxMentions = Math.max(1, maxMentions);
                dbGuild.document.automod.antiMentionSpam.checkEveryone = checkEveryone;
                dbGuild.document.automod.antiMentionSpam.action = action;

                const logEmbed = EmbedGenerator.basicEmbed(
                    `Anti Mention Spam configured by ${interaction.user.tag}\nEnabled: ${enabled}\nMax Mentions: ${maxMentions} | Check @everyone: ${checkEveryone} | Action: ${action}`
                ).setTitle('Automod: Anti Mention Spam');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                try {
                    const msg = await interaction.message?.fetch?.();
                    if (msg) {
                        const embed = automodCommand.buildAutomodEmbed(dbGuild);
                        const components = automodCommand.getAutomodComponents(dbGuild);
                        await msg.edit({ embeds: [embed], components });
                    }
                } catch {}
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('🔒 | Anti Mention Spam settings saved!')],
                    ephemeral: true,
                });
            }

            if (customId === 'automod_modal_antispam') {
                const enabled = parseBool(interaction.fields.getTextInputValue('enabled'));
                const maxMessages =
                    parseInt(interaction.fields.getTextInputValue('maxMessages'), 10) || 5;
                const timeframe =
                    parseInt(interaction.fields.getTextInputValue('timeframe'), 10) || 5000;
                const maxDuplicates =
                    parseInt(interaction.fields.getTextInputValue('maxDuplicates'), 10) || 3;
                const actionRaw = (interaction.fields.getTextInputValue('action') || 'delete')
                    .trim()
                    .toLowerCase();
                const action = ['delete', 'warn', 'timeout'].includes(actionRaw)
                    ? actionRaw
                    : 'delete';

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'automod.antiSpam.enabled': enabled,
                            'automod.antiSpam.maxMessages': Math.max(1, maxMessages),
                            'automod.antiSpam.timeframe': Math.max(1000, timeframe),
                            'automod.antiSpam.maxDuplicates': Math.max(1, maxDuplicates),
                            'automod.antiSpam.action': action,
                        },
                    }
                );
                if (!dbGuild.document.automod) dbGuild.document.automod = {};
                if (!dbGuild.document.automod.antiSpam) dbGuild.document.automod.antiSpam = {};
                dbGuild.document.automod.antiSpam.enabled = enabled;
                dbGuild.document.automod.antiSpam.maxMessages = Math.max(1, maxMessages);
                dbGuild.document.automod.antiSpam.timeframe = Math.max(1000, timeframe);
                dbGuild.document.automod.antiSpam.maxDuplicates = Math.max(1, maxDuplicates);
                dbGuild.document.automod.antiSpam.action = action;

                const logEmbed = EmbedGenerator.basicEmbed(
                    `Anti Spam configured by ${interaction.user.tag}\nEnabled: ${enabled}\nMax Messages: ${maxMessages}/${timeframe}ms | Max Duplicates: ${maxDuplicates} | Action: ${action}`
                ).setTitle('Automod: Anti Spam');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                try {
                    const msg = await interaction.message?.fetch?.();
                    if (msg) {
                        const embed = automodCommand.buildAutomodEmbed(dbGuild);
                        const components = automodCommand.getAutomodComponents(dbGuild);
                        await msg.edit({ embeds: [embed], components });
                    }
                } catch {}
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('🔒 | Anti Spam settings saved!')],
                    ephemeral: true,
                });
            }
        }
    },
};
