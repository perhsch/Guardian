const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('language')
        .setDescription('Set your preferred language for bot responses')
        .setDMPermission(false)
        .addStringOption((option) =>
            option
                .setName('language')
                .setDescription('Language name or code (e.g. Spanish, es, German, fr, Japanese)')
                .setRequired(true)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     * @param {import('../../Classes/UsersManager').UsersManager} dbUser
     */
    async execute(interaction, client, dbGuild, dbUser) {
        const input = interaction.options.getString('language').trim();

        if (input.toLowerCase() === 'en' || input.toLowerCase() === 'english' || input === 'reset') {
            dbUser.language = 'en';
            return EmbedGenerator.basicEmbed(
                "Your language has been set to **English**. Use `/language <language>` to change it again."
            );
        }

        dbUser.language = input;
        return EmbedGenerator.basicEmbed(
            `Your language has been set to **${input}**. All bot responses will now be translated for you. Use \`/language en\` or \`/language reset\` to switch back to English.`
        );
    },
};
