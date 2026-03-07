import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('isbanned')
        .setDescription('Check if a user is banned or not via user id.')
        .addStringOption((option) =>
            option.setName('user-id').setDescription('The user ID to check.').setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const userId = interaction.options.getString('user-id', true);
        const bannedUsers = await interaction.guild.bans.fetch();
        const isBanned = bannedUsers.has(userId);
        return interaction.reply(`User with ID ${userId} is ${isBanned ? 'banned' : 'not banned'}.`);
    },
};
