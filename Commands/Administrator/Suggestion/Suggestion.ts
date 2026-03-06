import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import SuggestionSetup from './Suggestion.setup.ts';
import SuggestionDisable from './Suggestion.disable.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('suggestion')
        .setDescription('Suggestion system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addSubcommand(SuggestionSetup.data)
        .addSubcommand(SuggestionDisable.data),
    subCommands: [SuggestionSetup, SuggestionDisable],
};
