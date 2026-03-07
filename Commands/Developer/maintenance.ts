import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ActivityType } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { setMaintenanceEnabled } from '../../Functions/maintenance.ts';

export default {
    enabled: true,
    developer: true,
    data: new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('Enable or disable maintenance mode (status + commands).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption((option) =>
            option
                .setName('enable')
                .setDescription('True = enter maintenance mode, False = exit maintenance mode.')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, client: any) {
        const enable = interaction.options.getBoolean('enable', true);

        if (enable) {
            setMaintenanceEnabled(true);
            client.user?.setPresence({
                activities: [{ name: 'In Maintenance', type: ActivityType.Watching }],
                status: 'dnd',
            });
            client.commands?.forEach((command: any) => {
                if (command.data.name !== 'maintenance') command.enabled = false;
            });
            return {
                embeds: [EmbedGenerator.basicEmbed('Maintenance mode **enabled**. Status set to "In Maintenance", all commands (except this one) are disabled.')],
                ephemeral: true,
            };
        }

        setMaintenanceEnabled(false);
        client.user?.setPresence({
            activities: [{ name: `${client.guilds.cache.size} servers!`, type: ActivityType.Watching }],
            status: 'online',
        });
        client.commands?.forEach((command: any) => {
            command.enabled = true;
        });
        return {
            embeds: [EmbedGenerator.basicEmbed('Maintenance mode **disabled**. Status restored, all commands re-enabled.')],
            ephemeral: true,
        };
    },
};
