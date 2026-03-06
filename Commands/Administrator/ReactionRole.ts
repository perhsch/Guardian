import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChatInputCommandInteraction, 
    Client, 
    TextChannel, 
    Message,
    Role,
    Guild
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';
import ReactionRoles from '../../Schemas/ReactionRoles.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Create a reaction role message.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageMessages
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

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.channel) return;

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
            interaction.options.getRole('role10'),
        ].filter((role): role is Role => !!role);

        await interaction.deferReply({ ephemeral: true });

        try {
            const sent = await (interaction.channel as TextChannel).send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        roles.map((role, index) => {
                            const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index];
                            const memberCount = role.members.size;
                            return `${emoji} **${role.name}** \`${role.id}\`\n   └─ *${memberCount} member${memberCount !== 1 ? 's' : ''} currently has this role*`;
                        }).join('\n\n')
                    ).setTitle(`${title} | Reaction Roles`),
                ],
            });

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            for (let i = 0; i < roles.length; i++) {
                await sent.react(emojis[i]!).catch(() => null);
            }

            await ReactionRoles.create({
                guild: interaction.guild.id,
                message: sent.id,
                channel: interaction.channel.id,
                title: title,
                roles: roles.map((role) => role.id),
            });

            // Start the hourly update task
            startRoleCountUpdate(interaction.guild, sent.id);

            const logEmbed = EmbedGenerator.basicEmbed(
                [
                    `- Moderator: ${interaction.user.tag}`,
                    `- Channel: <#${interaction.channel.id}>`,
                    `- Title: ${title}`,
                    `- Roles: ${roles.map((r) => r.name).join(', ')}`,
                ].join('\n')
            ).setTitle('/reactionrole command used');
            await sendModLog(interaction.guild, dbGuild, logEmbed);

            await interaction.editReply({
                embeds: [EmbedGenerator.basicEmbed('Reaction Role message created.')],
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ embeds: [EmbedGenerator.errorEmbed('Failed to create reaction role message.')] });
        }
    },
};

/**
 * Starts an hourly task to update the member counts in reaction role messages
 */
function startRoleCountUpdate(guild: Guild, messageId: string) {
    const updateInterval = setInterval(async () => {
        try {
            const reactionRoleData = await ReactionRoles.findOne({ message: messageId });
            if (!reactionRoleData) {
                clearInterval(updateInterval);
                return;
            }

            const channel = await guild.channels.fetch(reactionRoleData.channel).catch(() => null) as TextChannel | null;
            if (!channel) {
                clearInterval(updateInterval);
                return;
            }

            const message = await channel.messages.fetch(messageId).catch(() => null) as Message | null;
            if (!message) {
                clearInterval(updateInterval);
                return;
            }

            const freshRoles = reactionRoleData.roles
                .map(roleId => guild.roles.cache.get(roleId))
                .filter((role): role is Role => !!role);

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            const updatedEmbed = EmbedGenerator.basicEmbed(
                freshRoles.map((role, index) => {
                    const emoji = emojis[index];
                    const memberCount = role.members.size;
                    return `${emoji} **${role.name}** \`${role.id}\`\n   └─ *${memberCount} member${memberCount !== 1 ? 's' : ''} currently has this role*`;
                }).join('\n\n')
            ).setTitle(`${reactionRoleData.title} | Reaction Roles`);

            await message.edit({ embeds: [updatedEmbed] });
        } catch (error) {
            console.error('Failed to update reaction role message:', error);
            clearInterval(updateInterval);
        }
    }, 3600000); // 1 hour
}
