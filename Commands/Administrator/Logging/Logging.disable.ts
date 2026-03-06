import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';
import Guilds from '../../../Schemas/Guilds.ts';

export default {
    data: new SlashCommandSubcommandBuilder()
        .setName('disable')
        .setDescription('Disable the logging system.'),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        if (!dbGuild.logs.enabled) {
            return { embeds: [EmbedGenerator.errorEmbed('The logging system is not enabled!')], ephemeral: true };
        }

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/logging disable command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        dbGuild.logs.enabled = false;
        dbGuild.logs.basic_logs = null;
        dbGuild.logs.moderator = null;

        await Guilds.updateOne(
            { guild: interaction.guildId },
            { $set: { logs: { enabled: false, basic_logs: null, moderator: null } } }
        );

        return { embeds: [EmbedGenerator.basicEmbed('🔓 | The logging system has been disabled!')] };
    },
};
