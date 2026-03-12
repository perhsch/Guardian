import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the verification system.'),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        if (!dbGuild.verification.enabled) {
            return {
                embeds: [EmbedGenerator.errorEmbed('The verification system is not enabled!')],
                ephemeral: true,
            };
        }

        const logEmbed = EmbedGenerator.basicEmbed(`- Moderator: ${interaction.user.tag}`).setTitle(
            '/verification disable command used'
        );
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.verification.enabled = false;
        dbGuild.verification.version = null;
        dbGuild.verification.channel = null;
        dbGuild.verification.role = null;
        dbGuild.verification.unverifiedRole = null;

        return {
            embeds: [EmbedGenerator.basicEmbed('🔓 | Member verification has been disabled.')],
        };
    },
};
