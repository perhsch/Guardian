import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder, Role } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Configure the auto-role system.')
        .addRoleOption((option) =>
            option
                .setName('member')
                .setDescription('Select the role given to new members.')
                .setRequired(true)
        )
        .addRoleOption((option) =>
            option.setName('bot').setDescription('Select the role given to new bots.')
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const memberRole = interaction.options.getRole('member', true) as Role;
        const botRole = interaction.options.getRole('bot') as Role | null;

        dbGuild.autorole.enabled = true;
        dbGuild.autorole.member = memberRole.id;
        dbGuild.autorole.bot = botRole?.id || null;

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Member role: ${memberRole.name} (\`${memberRole.id}\`)`,
                `- Bot role: ${botRole ? `${botRole.name} (\`${botRole.id}\`)` : 'Not specified'}`,
            ].join('\n')
        ).setTitle('/autorole setup command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return {
            embeds: [
                EmbedGenerator.basicEmbed(
                    [
                        '🔒 | The Auto-Role system has been enabled!',
                        '',
                        `• Member Auto-Role Updated: <@&${memberRole.id}>`,
                        `• Bot Auto-Role Updated: ${botRole ? `<@&${botRole.id}>` : 'Not Specified.'}`,
                    ].join('\n')
                )
            ]
        };
    },
};
