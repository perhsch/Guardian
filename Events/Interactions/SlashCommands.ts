import Discord from 'discord.js';
import { GuildsManager } from '../../Classes/GuildsManager.ts';
import { UsersManager } from '../../Classes/UsersManager.ts';
import { translateResponse, translateText } from '../../Functions/translate.ts';

/**
 * Wraps an interaction so reply/editReply/followUp translate payloads to the user's language.
 * Returns original reply/editReply so callers can send pre-translated payloads without double translation.
 * @param {Discord.ChatInputCommandInteraction} interaction
 * @param {string | null} userLang
 */
function wrapInteractionForTranslation(
    interaction: Discord.ChatInputCommandInteraction,
    userLang: string | null
) {
    const originalReply = interaction.reply.bind(interaction);
    const originalEditReply = interaction.editReply.bind(interaction);
    const originalFollowUp = interaction.followUp.bind(interaction);
    const originalDeferReply = interaction.deferReply?.bind(interaction);

    if (!userLang || userLang.toLowerCase() === 'en') {
        return { originalReply, originalEditReply };
    }

    const translatePayload = async (payload: any) => {
        if (payload == null) return payload;
        const options = typeof payload === 'string' ? { content: payload } : { ...payload };
        return translateResponse(options, userLang);
    };

    const replyOptions = (o: any) => {
        if (typeof o === 'string') return { content: o };
        const safe: any = {};
        if (o.content !== undefined && o.content !== null) safe.content = o.content;
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

    const editPayload = (o: any) => {
        const safe = replyOptions(o);
        delete safe.ephemeral;
        delete safe.fetchReply;
        return safe;
    };

    // @ts-ignore - Overriding interaction methods
    interaction.reply = async (options: any) => {
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

    // @ts-ignore
    interaction.editReply = async (options: any) => {
        const fallback = typeof options === 'string' ? { content: options } : options;
        try {
            const translated = await translatePayload(options);
            return await originalEditReply(translated);
        } catch {
            return await originalEditReply(fallback);
        }
    };

    // @ts-ignore
    interaction.followUp = async (options: any) => {
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

export default {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     * @param {Discord.Client} client
     */
    async execute(interaction: Discord.Interaction, client: any) {
        if (!interaction.isChatInputCommand()) return;

        const guildId = interaction.guild?.id || 'dm';
        const dbUser = await UsersManager.fetch(interaction.user.id, guildId);
        const userLang = dbUser.language;

        const translateContent = async (text: string) =>
            userLang && userLang.toLowerCase() !== 'en'
                ? await translateText(text, userLang)
                : text;

        let executeFunction: Function | undefined;

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
            // Look for separate subcommand file first
            const subCommandFile = client.subCommands.get(
                `${interaction.commandName}.${subCommand}`
            );
            if (subCommandFile) {
                executeFunction = subCommandFile.execute;
            } else if (command.execute) {
                // Fallback to main command execute function if it exists
                executeFunction = command.execute;
            } else {
                return interaction.reply({
                    content: await translateContent('This sub command is outdated.'),
                    ephemeral: true,
                });
            }
        }

        const dbGuild = interaction.guild ? await GuildsManager.fetch(interaction.guild.id) : null;

        // Check if guild is set up (only for guild commands, not DMs)
        // Allow setup and help commands to run even if not set up
        if (
            interaction.guild &&
            dbGuild &&
            !dbGuild.setup &&
            interaction.commandName !== 'setup' &&
            interaction.commandName !== 'help'
        ) {
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

        if (!executeFunction) {
            return interaction.reply({
                content: await translateContent('This command has no execution function.'),
                ephemeral: true,
            });
        }

        // Additional null check for interaction.guild before executing command
        if (interaction.commandName !== 'help' && !interaction.guild) {
            return interaction.reply({
                content: await translateContent('This command can only be used in a server.'),
                ephemeral: true,
            });
        }

        const response = await executeFunction(interaction, client, dbGuild, dbUser);

        if (response) {
            let parsedResponse: any = {
                embeds: response.embeds || [],
                components: response.components || [],
                ephemeral: response.ephemeral || false,
            };

            // Only set content if it exists and is not empty
            if (response.content && response.content.trim() !== '') {
                parsedResponse.content = response.content;
            }

            if (response instanceof Discord.EmbedBuilder) parsedResponse.embeds.push(response);
            if (typeof response === 'string' && response.trim() !== '') {
                parsedResponse.content = response;
            }

            // Ensure we have either content or embeds to avoid empty message error
            if (
                !parsedResponse.content &&
                (!parsedResponse.embeds || parsedResponse.embeds.length === 0)
            ) {
                return; // Don't send empty message
            }

            if (needsTranslation) {
                parsedResponse = await translateResponse(parsedResponse, userLang);
            }

            if (interaction.replied || interaction.deferred) {
                await originalEditReply(parsedResponse);
            } else {
                await originalReply(parsedResponse);
            }
        }
    },
};
