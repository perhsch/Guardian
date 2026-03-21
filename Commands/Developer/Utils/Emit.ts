import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    developer: true,
    data: new SlashCommandBuilder()
        .setName('emit')
        .setDescription('Emit the guildMemberAdd/Remove events.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    execute(interaction: ChatInputCommandInteraction, client: Client): void {
        // Check if user is a developer
        const developerIds = ['1447738202600505407'];
        if (!developerIds.includes(interaction.user.id)) {
            interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('❌ This command is restricted to developers only.')],
                ephemeral: true
            });
            return;
        }

        client.emit('guildMemberRemove', interaction.member as GuildMember);

        interaction.reply({ content: 'Emitted GuildMemberRemove', ephemeral: true });
    },
};
