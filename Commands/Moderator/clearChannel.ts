import { SlashCommandBuilder, PermissionsBitField, ChatInputCommandInteraction, Client, TextChannel, GuildMember } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('clearchannel')
        .setDescription('Clear all messages in the channel')
        .setDMPermission(false),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.channel || !interaction.member) return;

        if (!(interaction.member as GuildMember).permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.channel as TextChannel;
        let deletedSize = 0;

        while (true) {
            const fetchedMessages = await channel.messages.fetch({ limit: 100 });
            if (fetchedMessages.size === 0) break;
            const deletedMessages = await channel.bulkDelete(fetchedMessages, true);
            if (deletedMessages.size === 0) break;
            deletedSize += deletedMessages.size;
        }

        const logEmbed = EmbedGenerator.basicEmbed(
            [`- Moderator: ${interaction.user.tag}`, `- Channel: <#${channel.id}>`, `- Messages deleted: ${deletedSize}`].join('\n')
        ).setTitle('/clearchannel command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return interaction.followUp({ content: `Successfully deleted **${deletedSize}** messages in this channel.` });
    },
};
