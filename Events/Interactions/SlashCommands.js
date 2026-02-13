const Discord = require('discord.js');

const { GuildsManager } = require('../../Classes/GuildsManager');
const { UsersManager } = require('../../Classes/UsersManager');
const { translateResponse, translateText } = require('../../Functions/translate');

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
            userLang && userLang.toLowerCase() !== 'en' ? await translateText(text, userLang) : text;

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
                content: await translateContent(
                    'This command is only available to the developer.'
                ),
                ephemeral: true,
            });
        }

        const subCommand = interaction.options.getSubcommand(false);
        if (subCommand) {
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

        const dbGuild = interaction.guild
            ? await GuildsManager.fetch(interaction.guild.id)
            : null;
        const response = await executeFunction(interaction, client, dbGuild, dbUser);

        if (response) {
            let parsedResponse = {
                content: response.content || null,
                embeds: response.embeds || [],
                ephemeral: response.ephemeral || false,
            };

            if (response instanceof Discord.EmbedBuilder) parsedResponse.embeds.push(response);
            if (typeof response === 'string') parsedResponse.content = response;

            const userLang = dbUser.language;
            if (userLang && userLang.toLowerCase() !== 'en') {
                parsedResponse = await translateResponse(parsedResponse, userLang);
            }

            if (interaction.replied || interaction.deferred) {
                interaction.editReply(parsedResponse);
            } else {
                interaction.reply(parsedResponse);
            }
        }
    },
};
