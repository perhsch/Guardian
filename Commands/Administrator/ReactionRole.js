const Discord = require(`discord.js`);

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

const ReactionRoles = require('../../Schemas/ReactionRoles');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Create a reaction role message.')
        .setDefaultMemberPermissions(
            Discord.PermissionFlagsBits.ManageRoles | Discord.PermissionFlagsBits.ManageMessages
        )
        .setDMPermission(false)
        .addStringOption((option) =>
            option.setName('title').setDescription('Title to use for the embed.').setRequired(true)
        )
        .addRoleOption((option) =>
            option.setName('role1').setDescription('Reaction Role.').setRequired(true)
        )
        .addRoleOption((option) => option.setName('role2').setDescription('Reaction Role.'))
        .addRoleOption((option) => option.setName('role3').setDescription('Reaction Role.'))
        .addRoleOption((option) => option.setName('role4').setDescription('Reaction Role.'))
        .addRoleOption((option) => option.setName('role5').setDescription('Reaction Role.'))
        .addRoleOption((option) => option.setName('role6').setDescription('Reaction Role.'))
        .addRoleOption((option) => option.setName('role7').setDescription('Reaction Role.'))
        .addRoleOption((option) => option.setName('role8').setDescription('Reaction Role.'))
        .addRoleOption((option) => option.setName('role9').setDescription('Reaction Role.'))
        .addRoleOption((option) => option.setName('role10').setDescription('Reaction Role.')),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const title = interaction.options.getString('title', true);
        const roles = [
            interaction.options.getRole('role1', true),
            interaction.options.getRole('role2'),
            interaction.options.getRole('role3'),
            interaction.options.getRole('role4'),
            interaction.options.getRole('role5'),
            interaction.options.getRole('role6'),
            interaction.options.getRole('role7'),
            interaction.options.getRole('role8'),
            interaction.options.getRole('role9'),
        ].filter((role) => !!role);

        await interaction.deferReply({ ephemeral: true });

        /** @type {Discord.TextChannel} */ (interaction.channel)
            .send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        roles.map((role, index) => {
                            const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'][index];
                            const memberCount = role.members.size;
                            return `${emoji} **${role.name}** \`${role.id}\`\n   └─ *${memberCount} member${memberCount !== 1 ? 's' : ''} currently has this role*`;
                        }).join('\n\n')
                    ).setTitle(`${title} | Reaction Roles`),
                ],
            })
            .catch(() => {
                interaction.editReply({ embeds: [EmbedGenerator.errorEmbed()] });
            })
            .then(async (/** @type {Discord.Message} */ sent) => {
                for (let i = 0; i < roles.length; i++)
                    await sent.react(['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'][i]); // should probably .catch() this but idk how
                await ReactionRoles.create({
                    guild: interaction.guild.id,
                    message: sent.id,
                    channel: interaction.channel.id,
                    title: title,
                    roles: roles.map((role) => role.id),
                });

                // Start the hourly update task
                startRoleCountUpdate(interaction.guild, sent.id, title, roles);

                const logEmbed = EmbedGenerator.basicEmbed(
                    [
                        `- Moderator: ${interaction.user.tag}`,
                        `- Channel: <#${interaction.channel.id}>`,
                        `- Title: ${title}`,
                        `- Roles: ${roles.map((r) => r.name).join(', ')}`,
                    ].join('\n')
                ).setTitle('/reactionrole command used');
                await sendModLog(interaction.guild, dbGuild, logEmbed);

                interaction.editReply({
                    embeds: [EmbedGenerator.basicEmbed('Reaction Role message created.')],
                });
            });
    },
};

/**
 * Starts an hourly task to update the member counts in reaction role messages
 * @param {Discord.Guild} guild 
 * @param {string} messageId 
 * @param {string} title 
 * @param {Discord.Role[]} roles 
 */
function startRoleCountUpdate(guild, messageId, title, roles) {
    const updateInterval = setInterval(async () => {
        try {
            // Get the reaction role data from database
            const reactionRoleData = await ReactionRoles.findOne({ message: messageId });
            if (!reactionRoleData) {
                clearInterval(updateInterval);
                return;
            }

            const channel = await guild.channels.fetch(reactionRoleData.channel).catch(() => null);
            if (!channel) {
                clearInterval(updateInterval);
                return;
            }

            const message = await channel.messages.fetch(messageId).catch(() => null);
            if (!message) {
                clearInterval(updateInterval);
                return;
            }

            // Get fresh role data
            const freshRoles = reactionRoleData.roles.map(roleId => guild.roles.cache.get(roleId)).filter(Boolean);

            const updatedEmbed = EmbedGenerator.basicEmbed(
                freshRoles.map((role, index) => {
                    const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'][index];
                    const memberCount = role.members.size;
                    return `${emoji} **${role.name}** \`${role.id}\`\n   └─ *${memberCount} member${memberCount !== 1 ? 's' : ''} currently has this role*`;
                }).join('\n\n')
            ).setTitle(`${reactionRoleData.title} | Reaction Roles`);

            await message.edit({ embeds: [updatedEmbed] });
        } catch (error) {
            console.error('Failed to update reaction role message:', error);
            // If we can't update after a few tries, stop trying
            clearInterval(updateInterval);
        }
    }, 3600000); // 1 hour in milliseconds
}
