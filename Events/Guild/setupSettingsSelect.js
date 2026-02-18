const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { GuildsManager } = require('../../Classes/GuildsManager');
const { sendModLog } = require('../../Functions/modLog');
const Guilds = require('../../Schemas/Guilds');

const TextInputStyle = Discord.TextInputStyle;

function buildSetupSelectOptions(dbGuild) {
    const needsLogging =
        !dbGuild?.logs?.basic ||
        !dbGuild?.logs?.moderator ||
        !dbGuild?.logs?.suggestionsChannel ||
        !dbGuild?.logs?.announcementChannel ||
        !dbGuild?.logs?.giveawayChannel;
    const needsSuggestion = !dbGuild?.suggestion?.enabled || !dbGuild?.suggestion?.channel;
    const needsTickets =
        !dbGuild?.tickets?.enabled ||
        !dbGuild?.tickets?.channel ||
        !dbGuild?.tickets?.category ||
        !dbGuild?.tickets?.role;

    const options = [];
    if (needsLogging)
        options.push(
            new Discord.StringSelectMenuOptionBuilder()
                .setLabel('Logging & Channels')
                .setValue('logging')
                .setDescription('Configure log, mod log, suggestions, announcement & giveaway channels')
                .setEmoji('📋')
        );
    if (needsSuggestion)
        options.push(
            new Discord.StringSelectMenuOptionBuilder()
                .setLabel('Suggestion System')
                .setValue('suggestion')
                .setDescription('Enable suggestions and set the suggestions channel')
                .setEmoji('💡')
        );
    if (needsTickets)
        options.push(
            new Discord.StringSelectMenuOptionBuilder()
                .setLabel('Ticket System')
                .setValue('tickets')
                .setDescription('Configure the ticket system')
                .setEmoji('🎫')
        );
    return options;
}

function parseIdInput(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function buildLoggingModal(dbGuild) {
    const basicInput = new Discord.TextInputBuilder()
        .setCustomId('log_channel')
        .setLabel('Basic Log Channel ID')
        .setPlaceholder('Paste the channel ID (required)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(17)
        .setMaxLength(20);
    if (dbGuild?.logs?.basic) basicInput.setValue(dbGuild.logs.basic);

    const optional = (id, label, value) => {
        const input = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setPlaceholder('Leave empty to skip')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(20);
        if (value) input.setValue(value);
        return new Discord.ActionRowBuilder().addComponents(input);
    };

    return new Discord.ModalBuilder()
        .setCustomId('setup_modal_logging')
        .setTitle('Logging & Channels')
        .addComponents(
            new Discord.ActionRowBuilder().addComponents(basicInput),
            optional('modlog_channel', 'Mod Log Channel ID', dbGuild?.logs?.moderator),
            optional(
                'suggestions_channel',
                'Suggestions Channel ID',
                dbGuild?.logs?.suggestionsChannel || dbGuild?.suggestion?.channel
            ),
            optional('announcement_channel', 'Announcement Channel ID', dbGuild?.logs?.announcementChannel),
            optional('giveaway_channel', 'Giveaway Channel ID', dbGuild?.logs?.giveawayChannel)
        );
}

function buildSuggestionModal(dbGuild) {
    const channelInput = new Discord.TextInputBuilder()
        .setCustomId('channel')
        .setLabel('Suggestions Channel ID')
        .setPlaceholder('Paste the channel ID (required)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(17)
        .setMaxLength(20);
    const channelVal =
        dbGuild?.suggestion?.channel || dbGuild?.logs?.suggestionsChannel;
    if (channelVal) channelInput.setValue(channelVal);

    const reactionsInput = new Discord.TextInputBuilder()
        .setCustomId('reactions')
        .setLabel('Add upvote/downvote reactions?')
        .setPlaceholder('yes or no (default: yes)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(3);
    if (dbGuild?.suggestion?.reactions) reactionsInput.setValue('yes');

    return new Discord.ModalBuilder()
        .setCustomId('setup_modal_suggestion')
        .setTitle('Suggestion System')
        .addComponents(
            new Discord.ActionRowBuilder().addComponents(channelInput),
            new Discord.ActionRowBuilder().addComponents(reactionsInput)
        );
}

function buildTicketsModal(dbGuild) {
    const makeRequired = (id, label, placeholder) => {
        const input = new Discord.TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setPlaceholder(placeholder)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(17)
            .setMaxLength(20);
        const val = dbGuild?.tickets?.[id];
        if (val) input.setValue(val);
        return new Discord.ActionRowBuilder().addComponents(input);
    };

    return new Discord.ModalBuilder()
        .setCustomId('setup_modal_tickets')
        .setTitle('Ticket System')
        .addComponents(
            makeRequired('category', 'Category ID', 'Category for tickets'),
            makeRequired(
                'channel',
                'Ticket Creation Channel ID',
                'Channel with open ticket button'
            ),
            makeRequired('role', 'Staff Role ID', 'Role that can access tickets')
        );
}

module.exports = {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     * @param {Discord.Client} client
     */
    async execute(interaction, client) {
        if (interaction.isButton() && interaction.customId === 'setup_settings_button') {
            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Only administrators can use setup.')],
                    ephemeral: true,
                });
            }
            const dbGuild = await GuildsManager.fetch(interaction.guild.id);
            const options = buildSetupSelectOptions(dbGuild);
            if (options.length === 0) {
                return interaction.reply({
                    content: 'All features are configured!',
                    ephemeral: true,
                });
            }
            const selectRow = new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId('setup_settings_select')
                    .setPlaceholder('⚙️ Choose a feature to configure...')
                    .addOptions(options)
            );
            return interaction.update({
                components: [selectRow],
            });
        }

        if (interaction.isStringSelectMenu() && interaction.customId === 'setup_settings_select') {
            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Only administrators can use setup.')],
                    ephemeral: true,
                });
            }

            const value = interaction.values[0];
            const dbGuild = await GuildsManager.fetch(interaction.guild.id);

            let modal;
            if (value === 'logging') modal = buildLoggingModal(dbGuild);
            else if (value === 'suggestion') modal = buildSuggestionModal(dbGuild);
            else if (value === 'tickets') modal = buildTicketsModal(dbGuild);
            else return;

            return interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            const customId = interaction.customId;
            if (
                customId !== 'setup_modal_logging' &&
                customId !== 'setup_modal_suggestion' &&
                customId !== 'setup_modal_tickets'
            ) {
                return;
            }

            if (!interaction.memberPermissions?.has(Discord.PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Only administrators can use setup.')],
                    ephemeral: true,
                });
            }

            const dbGuild = await GuildsManager.fetch(interaction.guild.id);

            if (customId === 'setup_modal_logging') {
                const logChannelId = interaction.fields.getTextInputValue('log_channel').trim();
                const modLogId = parseIdInput(interaction.fields.getTextInputValue('modlog_channel'));
                const suggestionsId = parseIdInput(
                    interaction.fields.getTextInputValue('suggestions_channel')
                );
                const announcementId = parseIdInput(
                    interaction.fields.getTextInputValue('announcement_channel')
                );
                const giveawayId = parseIdInput(
                    interaction.fields.getTextInputValue('giveaway_channel')
                );

                const logChannel = await interaction.guild.channels
                    .fetch(logChannelId)
                    .catch(() => null);
                if (!logChannel || logChannel.type !== Discord.ChannelType.GuildText) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid basic log channel ID: \`${logChannelId}\`. Make sure it's a text channel in this server.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                const validateChannel = async (id, name) => {
                    if (!id) return null;
                    const ch = await interaction.guild.channels.fetch(id).catch(() => null);
                    if (!ch || ch.type !== Discord.ChannelType.GuildText) return null;
                    return ch.id;
                };

                const modLogValid = modLogId
                    ? await validateChannel(modLogId, 'mod log')
                    : null;
                const suggestionsValid = suggestionsId
                    ? await validateChannel(suggestionsId, 'suggestions')
                    : null;
                const announcementValid = announcementId
                    ? await validateChannel(announcementId, 'announcement')
                    : null;
                const giveawayValid = giveawayId
                    ? await validateChannel(giveawayId, 'giveaway')
                    : null;

                if (modLogId && !modLogValid) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid mod log channel ID: \`${modLogId}\`. Must be a text channel.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }
                if (suggestionsId && !suggestionsValid) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid suggestions channel ID: \`${suggestionsId}\`. Must be a text channel.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }
                if (announcementId && !announcementValid) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid announcement channel ID: \`${announcementId}\`. Must be a text channel.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }
                if (giveawayId && !giveawayValid) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid giveaway channel ID: \`${giveawayId}\`. Must be a text channel.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                const logsPayload = {
                    enabled: true,
                    basic: logChannel.id,
                    moderator: modLogValid,
                    suggestionsChannel: suggestionsValid,
                    announcementChannel: announcementValid,
                    giveawayChannel: giveawayValid,
                };
                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    { $set: { logs: logsPayload } }
                );
                if (suggestionsValid) {
                    await Guilds.updateOne(
                        { guild: interaction.guildId },
                        {
                            $set: {
                                'suggestion.channel': suggestionsValid,
                                'suggestion.enabled': true,
                            },
                        }
                    );
                }

                const lines = [
                    `- Moderator: ${interaction.user.tag}`,
                    `- Basic log channel: <#${logChannel.id}>`,
                    modLogValid ? `- Mod log channel: <#${modLogValid}>` : null,
                    suggestionsValid ? `- Suggestions channel: <#${suggestionsValid}>` : null,
                    announcementValid ? `- Announcement channel: <#${announcementValid}>` : null,
                    giveawayValid ? `- Giveaway channel: <#${giveawayValid}>` : null,
                ].filter(Boolean);
                const logEmbed = EmbedGenerator.basicEmbed(lines.join('\n')).setTitle(
                    'Setup modal: Logging'
                );
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                const replyLines = [
                    '🔒 | Logging channels updated!',
                    '',
                    `• Basic: <#${logChannel.id}>`,
                    modLogValid ? `• Mod Log: <#${modLogValid}>` : null,
                    suggestionsValid ? `• Suggestions: <#${suggestionsValid}>` : null,
                    announcementValid ? `• Announcement: <#${announcementValid}>` : null,
                    giveawayValid ? `• Giveaway: <#${giveawayValid}>` : null,
                ].filter(Boolean);
                return interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed(replyLines.join('\n'))],
                    ephemeral: true,
                });
            }

            if (customId === 'setup_modal_suggestion') {
                const channelId = interaction.fields.getTextInputValue('channel').trim();
                const reactionsInput = interaction.fields
                    .getTextInputValue('reactions')
                    .trim()
                    .toLowerCase();
                const reactions = reactionsInput !== 'no' && reactionsInput !== 'false';

                const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
                if (!channel || channel.type !== Discord.ChannelType.GuildText) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid channel ID: \`${channelId}\`. Must be a text channel in this server.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'suggestion.enabled': true,
                            'suggestion.channel': channel.id,
                            'suggestion.reactions': reactions,
                            'logs.suggestionsChannel': channel.id,
                        },
                    }
                );

                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Channel: <#${channel.id}>`,
                        `- Add reactions: ${reactions}`,
                    ].join('\n')
                ).setTitle('Setup modal: Suggestion');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                return interaction.reply({
                    embeds: [
                        EmbedGenerator.basicEmbed(
                            `🔒 | Suggestion system configured!\n\n• Channel: <#${channel.id}>\n• Reactions: ${reactions ? 'Yes' : 'No'}`
                        ),
                    ],
                    ephemeral: true,
                });
            }

            if (customId === 'setup_modal_tickets') {
                const categoryId = interaction.fields.getTextInputValue('category').trim();
                const channelId = interaction.fields.getTextInputValue('channel').trim();
                const roleId = interaction.fields.getTextInputValue('role').trim();

                const category = await interaction.guild.channels
                    .fetch(categoryId)
                    .catch(() => null);
                if (!category || category.type !== Discord.ChannelType.GuildCategory) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid category ID: \`${categoryId}\`. Must be a category in this server.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
                if (!channel || channel.type !== Discord.ChannelType.GuildText) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid channel ID: \`${channelId}\`. Must be a text channel in this server.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
                if (!role) {
                    return interaction.reply({
                        embeds: [
                            EmbedGenerator.errorEmbed(
                                `Invalid role ID: \`${roleId}\`. Role not found in this server.`
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                await Guilds.updateOne(
                    { guild: interaction.guildId },
                    {
                        $set: {
                            'tickets.enabled': true,
                            'tickets.category': category.id,
                            'tickets.channel': channel.id,
                            'tickets.role': role.id,
                        },
                    }
                );

                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Category: ${category.name}`,
                        `- Channel: <#${channel.id}>`,
                        `- Support role: ${role}`,
                    ].join('\n')
                ).setTitle('Setup modal: Tickets');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                return interaction.reply({
                    embeds: [
                        EmbedGenerator.basicEmbed(
                            `🔒 | Ticket system configured!\n\n• Category: ${category.name}\n• Channel: <#${channel.id}>\n• Staff role: ${role}`
                        ),
                    ],
                    ephemeral: true,
                });
            }
        }
    },
};
