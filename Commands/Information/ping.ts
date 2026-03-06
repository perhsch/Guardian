import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDMPermission(false)
        .setDescription('Ping pong!'),

    execute(_interaction: ChatInputCommandInteraction, _client: Client) {
        return { content: 'Pong!', ephemeral: true };
    },
};
