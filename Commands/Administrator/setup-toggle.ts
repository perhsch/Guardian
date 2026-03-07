import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChatInputCommandInteraction, 
    Client, 
    EmbedBuilder 
} from 'discord.js';
import Guilds from '../../Schemas/Guilds.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('setup-toggle')
        .setDescription('Toggle the setup status of the server (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const currentStatus = dbGuild.setup;
        const newStatus = !currentStatus;

        await Guilds.updateOne({ guild: interaction.guild.id }, { $set: { setup: newStatus } });
        
        // Update the cached document as well
        if (dbGuild.document) {
            dbGuild.document.setup = newStatus;
        }

        const embed = new EmbedBuilder()
            .setColor(newStatus ? 0x00ff00 : 0xff0000)
            .setTitle('Setup Status Toggled')
            .setDescription(
                `Server setup status is now: **${newStatus ? '✅ Complete' : '❌ Incomplete'}**`
            )
            .addFields({
                name: 'What this means:',
                value: newStatus
                    ? 'All commands are now available for use in this server.'
                    : 'Only the `/setup` command can be used until setup is completed.',
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
