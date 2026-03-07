import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the ticket system.'),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/ticketadmin disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.tickets.enabled = false;
        dbGuild.tickets.category = null;
        dbGuild.tickets.channel = null;
        dbGuild.tickets.role = null;
        dbGuild.tickets.logChannel = null;

        return { embeds: [EmbedGenerator.basicEmbed('🔓 | Ticket system has been disabled!')] };
    },
};
