import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, Client } from 'discord.js';
// @ts-ignore — Backup schema may not have types
import backupSchema from '../../Schemas/Backup.ts';
import mongoose from 'mongoose';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Create a backup of the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const guildId = interaction.guild.id;
        const existingBackup = await backupSchema.findOne({ guildId });

        if (existingBackup) {
            return interaction.reply('A backup for this server already exists.');
        }

        const backupId = new mongoose.Types.ObjectId().toString();
        const backup = {
            guildId,
            date: new Date().toLocaleString(),
            name: `backup-${guildId}-${new Date().getTime()}`,
            backupId,
            roles: interaction.guild.roles.cache.map((role) => role),
            channels: interaction.guild.channels.cache.map((channel) => channel),
            permissions: interaction.guild.roles.cache.map((role) => role.permissions),
        };

        const newBackup = await new backupSchema(backup).save();
        await interaction.user.send(`Backup created with name ${backup.name} and ID ${newBackup.backupId}`);
        return interaction.reply({ content: `Backup created successfully! Details sent to your DMs.`, ephemeral: true });
    },
};
