import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import ms from 'ms';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDMPermission(false)
        .setDescription('View the bots uptime.'),

    execute(_interaction: ChatInputCommandInteraction, client: Client) {
        return {
            embeds: [
                EmbedGenerator.basicEmbed(
                    `The bot has been online for \`${ms(client.uptime ?? 0, { long: true })}\``
                ).setAuthor({
                    name: `${client.user!.tag} | Uptime`,
                    iconURL: client.user!.displayAvatarURL(),
                }),
            ],
            ephemeral: true,
        };
    },
};
