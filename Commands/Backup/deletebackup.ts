import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, Client } from 'discord.js';
// @ts-ignore — Backup schema may not have types
import backupSchema from '../../Schemas/Backup.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('deletebackup')
        .setDescription('Delete a backup of the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addStringOption((option) =>
            option
                .setName('backup_id')
                .setDescription('The ID of the backup you want to delete')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const backupId = interaction.options.getString('backup_id', true);
        const backup = await backupSchema.findOne({ id: backupId, guildId: interaction.guild.id });

        if (!backup) {
            return interaction.reply({ content: 'No backup found with that ID', ephemeral: true });
        }

        await backupSchema.deleteOne({ id: backupId, guildId: interaction.guild.id });
        return interaction.reply({ content: `Backup with ID ${backupId} has been deleted.`, ephemeral: true });
    },
};
