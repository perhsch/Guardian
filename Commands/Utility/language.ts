import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Set your preferred language for bot responses')
        .setDMPermission(false)
        .addStringOption((option) =>
            option
                .setName('language')
                .setDescription('Language name or code (e.g. Spanish, es, German)')
                .setRequired(true)
        ),

    async execute(
        interaction: ChatInputCommandInteraction,
        _client: Client,
        _dbGuild: any,
        dbUser: any
    ) {
        const input = interaction.options.getString('language', true).trim();

        if (!dbUser) {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed('User data not available. Please try again.'),
                ],
            };
        }

        if (['en', 'english', 'reset'].includes(input.toLowerCase())) {
            dbUser.language = 'en';
            await dbUser.save().catch(() => null);
            return {
                embeds: [
                    EmbedGenerator.basicEmbed(
                        'Your language has been set to **English**. Use `/language <language>` to change it again.'
                    ),
                ],
            };
        }

        dbUser.language = input;
        await dbUser.save().catch(() => null);
        return {
            embeds: [
                EmbedGenerator.basicEmbed(
                    `Your language has been set to **${input}**. All bot responses will now be translated for you. Use \`/language en\` or \`/language reset\` to switch back to English.`
                ),
            ],
        };
    },
};
