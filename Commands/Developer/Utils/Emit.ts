import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, Client, GuildMember } from 'discord.js';

export default {
    enabled: true,
    developer: true,
    data: new SlashCommandBuilder()
        .setName('emit')
        .setDescription('Emit the guildMemberAdd/Remove events.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    execute(interaction: ChatInputCommandInteraction, client: Client): void {
        client.emit('guildMemberRemove', interaction.member as GuildMember);

        interaction.reply({ content: 'Emitted GuildMemberRemove', ephemeral: true });
    },
};
