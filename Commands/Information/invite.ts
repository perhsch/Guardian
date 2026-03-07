import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDMPermission(false)
        .setDescription('Sends an invite of the bot to the user'),

    execute(_interaction: ChatInputCommandInteraction, _client: Client) {
        return {
            embeds: [EmbedGenerator.basicEmbed(
                `[Click me for the invite to the bot!](https://discord.com/oauth2/authorize?client_id=1469385720270426358&scope=bot)`
            )],
        };
    },
};
