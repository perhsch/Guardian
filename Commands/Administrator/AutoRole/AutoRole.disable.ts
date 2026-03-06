import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the auto-role system.'),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        if (!dbGuild.autorole.enabled) {
            return { embeds: [EmbedGenerator.errorEmbed('The Auto-Role system is not enabled!')], ephemeral: true };
        }

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/autorole disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.autorole.enabled = false;
        dbGuild.autorole.member = null;
        dbGuild.autorole.bot = null;

        return { embeds: [EmbedGenerator.basicEmbed('🔓 | The Auto-Role system has been disabled!')] };
    },
};
