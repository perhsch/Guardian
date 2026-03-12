import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('totalbans')
        .setDescription('Check how many users are banned in the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const bannedUsers = await interaction.guild.bans.fetch();
        return interaction.reply(
            `There are currently ${bannedUsers.size} banned users in this server.`
        );
    },
};
