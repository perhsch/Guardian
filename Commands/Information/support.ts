import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('support')
        .setDMPermission(false)
        .setDescription('Get support and join our community'),

    async execute(_interaction: ChatInputCommandInteraction, _client: Client) {
        const embed = EmbedGenerator.basicEmbed()
            .setColor(0x5865f2)
            .setTitle('Support')
            .setDescription(
                '[Join our support server](https://discord.gg/5nWZ8BJae4) for help and assistance!'
            );

        return { embeds: [embed] };
    },
};
