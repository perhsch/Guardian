const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { setMaintenanceEnabled } = require('../../Functions/maintenance');

const { ActivityType } = Discord;

module.exports = {
    enabled: true,
    developer: true,
    data: new Discord.SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('Enable or disable maintenance mode (status + commands).')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
        .addBooleanOption((option) =>
            option
                .setName('enable')
                .setDescription('True = enter maintenance mode, False = exit maintenance mode.')
                .setRequired(true)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const enable = interaction.options.getBoolean('enable', true);

        if (enable) {
            setMaintenanceEnabled(true);
            client.user.setPresence({
                activities: [{ name: 'In Maintenance', type: ActivityType.Watching }],
                status: 'dnd',
            });
            client.commands.forEach((command) => {
                if (command.data.name !== 'maintenance') command.enabled = false;
            });
            return {
                embeds: [
                    EmbedGenerator.basicEmbed(
                        'Maintenance mode **enabled**. Status set to "In Maintenance", all commands (except this one) are disabled.'
                    ),
                ],
                ephemeral: true,
            };
        }

        setMaintenanceEnabled(false);
        client.user.setPresence({
            activities: [
                {
                    name: `${client.guilds.cache.size} servers!`,
                    type: ActivityType.Watching,
                },
            ],
            status: 'online',
        });
        client.commands.forEach((command) => {
            command.enabled = true;
        });
        return {
            embeds: [
                EmbedGenerator.basicEmbed(
                    'Maintenance mode **disabled**. Status restored, all commands re-enabled.'
                ),
            ],
            ephemeral: true,
        };
    },
};
