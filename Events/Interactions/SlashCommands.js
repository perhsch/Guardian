const Discord = require('discord.js');

const { GuildsManager } = require('../../Classes/GuildsManager');
const { UsersManager } = require('../../Classes/UsersManager');
const { translateResponse, translateText } = require('../../Functions/translate');

/**
 * Wraps an interaction so reply/editReply/followUp translate payloads to the user's language.
 * Returns original reply/editReply so callers can send pre-translated payloads without double translation.
 * @param {Discord.ChatInputCommandInteraction} interaction
 * @param {String} userLang
 * @returns {{ originalReply: Function, originalEditReply: Function }}
 */
function wrapInteractionForTranslation(interaction, userLang) {
    const originalReply = interaction.reply.bind(interaction);
    const originalEditReply = interaction.editReply.bind(interaction);
    const originalFollowUp = interaction.followUp.bind(interaction);
    const originalDeferReply = interaction.deferReply?.bind(interaction);

    if (!userLang || userLang.toLowerCase() === 'en') {
        return { originalReply, originalEditReply };
    }

    const translatePayload = async (payload) => {
        if (payload == null) return payload;
        const options = typeof payload === 'string' ? { content: payload } : { ...payload };
        return translateResponse(options, userLang);
    };

    const replyOptions = (o) => {
        if (typeof o === 'string') return { content: o };
        const safe = {};
        if (o.content !== undefined) safe.content = o.content;
        if (o.embeds !== undefined) safe.embeds = o.embeds;
        if (o.components !== undefined) safe.components = o.components;
        if (o.files !== undefined) safe.files = o.files;
        if (o.ephemeral !== undefined) safe.ephemeral = o.ephemeral;
        if (o.fetchReply !== undefined) safe.fetchReply = o.fetchReply;
        if (o.allowedMentions !== undefined) safe.allowedMentions = o.allowedMentions;
        if (o.tts !== undefined) safe.tts = o.tts;
        if (o.flags !== undefined) safe.flags = o.flags;
        return safe;
    };

    const editPayload = (o) => {
        const safe = replyOptions(o);
        delete safe.ephemeral;
        delete safe.fetchReply;
        return safe;
    };

    interaction.reply = async (options) => {
        const fallback = typeof options === 'string' ? { content: options } : options;
        try {
            if (!interaction.deferred && originalDeferReply) {
                await originalDeferReply({ ephemeral: fallback.ephemeral ?? false });
            }
            const translated = await translatePayload(options);
            if (interaction.deferred) {
                return await originalEditReply(editPayload(translated));
            }
            return await originalReply(replyOptions(translated));
        } catch {
            if (interaction.deferred) {
                await originalEditReply(editPayload(fallback));
            } else {
                await originalReply(fallback);
            }
        }
    };
    interaction.editReply = async (options) => {
        const fallback = typeof options === 'string' ? { content: options } : options;
        try {
            const translated = await translatePayload(options);
            return await originalEditReply(translated);
        } catch {
            return await originalEditReply(fallback);
        }
    };
    interaction.followUp = async (options) => {
        const fallback = typeof options === 'string' ? { content: options } : options;
        try {
            const translated = await translatePayload(options);
            return await originalFollowUp(translated);
        } catch {
            return await originalFollowUp(fallback);
        }
    };

    return { originalReply, originalEditReply };
}

module.exports = {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     * @param {Discord.Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const guildId = interaction.guild?.id || 'dm';
        const dbUser = await UsersManager.fetch(interaction.user.id, guildId);
        const userLang = dbUser.language;

        const translateContent = async (text) =>
            userLang && userLang.toLowerCase() !== 'en'
                ? await translateText(text, userLang)
                : text;

        let executeFunction;

        const command = client.commands.get(interaction.commandName);
        if (!command)
            return interaction.reply({
                content: await translateContent('This command is outdated.'),
                ephemeral: true,
            });
        if (command.enabled === false)
            return interaction.reply({
                content: await translateContent(
                    'The bot is currently under maintenance. Please try again later.'
                ),
                ephemeral: true,
            });
        executeFunction = command.execute;

        if (command.developer && interaction.user.id !== '1447738202600505407') {
            return interaction.reply({
                content: await translateContent('This command is only available to the developer.'),
                ephemeral: true,
            });
        }

        const subCommand = interaction.options.getSubcommand(false);
        if (subCommand) {
            // Check if the main command handles subcommands internally
            if (
                command.subCommands ||
                command.data.options?.some((opt) => opt.type === 'SUB_COMMAND')
            ) {
                // Command handles subcommands internally, keep main execute function
                executeFunction = command.execute;
            } else {
                // Look for separate subcommand file
                const subCommandFile = client.subCommands.get(
                    `${interaction.commandName}.${subCommand}`
                );
                if (!subCommandFile)
                    return interaction.reply({
                        content: await translateContent('This sub command is outdated.'),
                        ephemeral: true,
                    });

                executeFunction = subCommandFile.execute;
            }
        }

        const dbGuild = interaction.guild ? await GuildsManager.fetch(interaction.guild.id) : null;

        // Check if guild is set up (only for guild commands, not DMs)
        // Allow setup command to run even if not set up
        if (interaction.guild && !dbGuild.setup && interaction.commandName !== 'setup') {
            return interaction.reply({
                content: await translateContent(
                    'This server has not completed setup. Please run the `/setup` command first.'
                ),
                ephemeral: true,
            });
        }

        const needsTranslation = userLang && userLang.toLowerCase() !== 'en';
        if (needsTranslation && interaction.deferReply) {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});
        }

        const { originalReply, originalEditReply } = wrapInteractionForTranslation(
            interaction,
            userLang
        );

        const response = await executeFunction(interaction, client, dbGuild, dbUser);

        if (response) {
            let parsedResponse = {
                content: response.content || null,
                embeds: response.embeds || [],
                components: response.components || [],
                ephemeral: response.ephemeral || false,
            };

            if (response instanceof Discord.EmbedBuilder) parsedResponse.embeds.push(response);
            if (typeof response === 'string') parsedResponse.content = response;

            if (needsTranslation) {
                parsedResponse = await translateResponse(parsedResponse, userLang);
            }

            if (interaction.replied || interaction.deferred) {
                originalEditReply(parsedResponse);
            } else {
                originalReply(parsedResponse);
            }
        }
    },
};
