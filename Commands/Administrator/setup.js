const Discord = require(`discord.js`);

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup basic bot stuff.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        await interaction.reply({ embeds: [generateEmbed(0, [])] });

        if (!interaction.guild.members.me.permissions.has('Administrator')) {
            const embed = generateEmbed(0, []);
            embed
                .setColor('Red')
                .setDescription(
                    `${embed.data.description}\n\n❌ Bot is missing the administrator permissions! Please grant the **Administrator** permission to the bot's role and run \`/setup\` again.`
                );
            return interaction.editReply({ embeds: [embed] });
        }

        await interaction.editReply({ embeds: [generateEmbed(1, [0])] });

        // Check that the bot's role is not at the bottom (since some permissions may not work if it's lower than managed/user roles),
        // but don't enforce that it must be highest
        const botRole = interaction.guild.roles.botRoleFor(client.user);
        const rolesAboveBot = interaction.guild.roles.cache.filter(
            role => role.position > botRole.position && !role.managed && role.editable
        );
        if (rolesAboveBot.size > 0) {
            const embed = generateEmbed(1, [0]);
            embed
                .setColor('Yellow')
                .setDescription(
                    `${embed.data.description}\n\n⚠️ The bot role is not the highest role in the server.\nThis is usually fine, but some role-based actions might fail if higher roles exist above the bot.\nConsider moving the bot's role above roles it needs to manage, then run \`/setup\` again if you run into issues.`
                );
            return interaction.editReply({ embeds: [embed] });
        }

        await interaction.editReply({ embeds: [generateEmbed(2, [0, 1])] });

        const memberLog = dbGuild.logs.basic ? 2 : '';

        await interaction.editReply({ embeds: [generateEmbed(3, [0, 1, memberLog])] });

        const modLog = dbGuild.logs.moderator ? 3 : '';

        await interaction.editReply({ embeds: [generateEmbed(4, [0, 1, memberLog, modLog])] });

        await new Promise((resolve) => setTimeout(() => resolve(), 2000));

        await interaction.editReply({ embeds: [generateEmbed(6, [0, 1, memberLog, modLog, 4])] });
    },
};

/**
 * this is gonna be a horrible function
 * @param {Number} count
 * @param {Array<Number>} completed
 */
function generateEmbed(count, completed) {
    const steps = [
        {
            id: 0,
            label: 'Checking for permissions...',
            warningOnFailure: false,
        },
        {
            id: 1,
            label: "Checking Guardian's role position (should be above the roles it needs to manage)...",
            warningOnFailure: true,
        },
        {
            id: 2,
            label: 'Checking for a log channel...',
            warningOnFailure: false,
        },
        {
            id: 3,
            label: 'Checking for a mod-log channel...',
            warningOnFailure: false,
        },
        {
            id: 4,
            label: 'Finishing up...',
            warningOnFailure: false,
        },
    ];

    const lines = ['✅ Initializing Quick Setup!', ''];

    steps.forEach((step, index) => {
        if (count < index) return;

        let prefix = '⏳ ';

        // If we've moved past this step, mark as completed / failed
        if (count > index) {
            if (completed.includes(step.id)) {
                prefix = '✅ ';
            } else if (step.warningOnFailure) {
                prefix = '⚠️ ';
            } else {
                prefix = '❌ ';
            }
        }

        lines.push(`${prefix}**[${index + 1}/${steps.length}] ${step.label}**`);
    });

    if (count >= steps.length) {
        lines.push('', '✅ **All checks completed!**');
    }

    return EmbedGenerator.basicEmbed(lines.join('\n')).setTitle('Guardian Setup:');
}
