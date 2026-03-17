import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    Role,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import EmbedGenerator from '../../../Functions/embedGenerator.ts';

async function handleListRoles(
    interaction: ChatInputCommandInteraction,
    _client: Client,
    _dbGuild: any
): Promise<void> {
    if (!interaction.guild) return;

    await interaction.deferReply();

    const roles = interaction.guild!.roles.cache
        .filter((role: Role) => role.id !== interaction.guild!.roles.everyone.id)
        .sort((a: Role, b: Role) => b.position - a.position);

    if (roles.size === 0) {
        await interaction.editReply({
            content: '❌ No roles found in this server.',
        });
        return;
    }

    // Create paginated embeds if there are many roles
    const pageSize = 20;
    const pages = Math.ceil(roles.size / pageSize);
    const currentPage = 0;

    const createEmbed = (page: number) => {
        const startIndex = page * pageSize;
        const endIndex = Math.min(startIndex + pageSize, roles.size);
        const pageRoles = Array.from(roles.values()).slice(startIndex, endIndex);

        const roleList = pageRoles.map((role: Role, index: number) => {
            const memberCount = role.members.size;
            const position = role.position;
            const mentionable = role.mentionable ? '✅' : '❌';
            const managed = role.managed ? '🤖' : '';
            const hoisted = role.hoist ? '📌' : '';
            const color = role.hexColor === '#000000' ? '⚫ Default' : `🎨 ${role.hexColor}`;
            
            // Create role status indicators
            const indicators = [];
            if (mentionable === '✅') indicators.push('🔔');
            if (managed) indicators.push('🤖');
            if (hoisted) indicators.push('📌');
            const indicatorString = indicators.length > 0 ? indicators.join(' ') : '📄';
            
            return `> **${startIndex + index + 1}.** ${role.name} <@&${role.id}> ${indicatorString}\n` +
                   `> ━━▣ **${memberCount}** members ┃ **Pos:** ${position} ┃ ${color}\n` +
                   `> ━━▣ \`${role.id}\` ┃ ${mentionable} Mentionable ${managed} ${hoisted}`;
        }).join('\n\n');

        // Calculate statistics
        const totalMembers = interaction.guild!.memberCount;
        const avgMembersPerRole = Math.round(Array.from(roles.values()).reduce((sum, role) => sum + role.members.size, 0) / roles.size);
        const managedRoles = Array.from(roles.values()).filter(role => role.managed).length;
        const mentionableRoles = Array.from(roles.values()).filter(role => role.mentionable).length;

        return EmbedGenerator.basicEmbed(roleList)
            .setTitle(`🎭 ${interaction.guild!.name} Role Directory`)
            .addFields(
                {
                    name: '� Server Analytics',
                    value: `>>> **Total Roles:** \`${roles.size}\`\n` +
                          `**👥 Server Members:** \`${totalMembers}\`\n` +
                          `**📊 Avg Members/Role:** \`${avgMembersPerRole}\`\n` +
                          `**🤖 Managed Roles:** \`${managedRoles}\`\n` +
                          `**🔔 Mentionable:** \`${mentionableRoles}\``,
                    inline: true
                },
                {
                    name: '📖 Navigation',
                    value: `>>> **Page:** \`${page + 1}/${pages}\`\n` +
                          `**Showing:** \`${startIndex + 1}-${Math.min(endIndex, roles.size)}\`\n` +
                          `**Total Items:** \`${roles.size}\`\n` +
                          `**Page Size:** \`${pageSize}\``,
                    inline: true
                }
            )
            .setColor('#5865F2')
            .setThumbnail(interaction.guild!.iconURL({ size: 256 }) || null)
            .setAuthor({ 
                name: 'Guardian Bot • Role Management',
                iconURL: interaction.client.user?.displayAvatarURL({ size: 64 }) || undefined
            })
            .setFooter({ 
                text: `Requested by ${interaction.user.username} • ${new Date().toLocaleDateString()}`,
                iconURL: interaction.user.displayAvatarURL({ size: 64 })
            })
            .setTimestamp();
    };

    const embed = createEmbed(currentPage);

    // If only one page is needed, send without pagination
    if (pages === 1) {
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    // Add pagination buttons for multiple pages
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('first')
                .setLabel('⏮ First')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(pages === 1),
            new ButtonBuilder()
                .setCustomId('last')
                .setLabel('Last ⏭')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(pages === 1)
        );

    const message = await interaction.editReply({ 
        embeds: [embed], 
        components: [row] 
    });

    // Create collector for pagination
    const collector = message.createMessageComponentCollector({
        time: 60000 // 60 seconds
    });

    let currentPageNum = currentPage;

    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({ content: '❌ You cannot use these buttons.', ephemeral: true });
            return;
        }

        await i.deferUpdate();

        if (i.customId === 'first') {
            currentPageNum = 0;
        } else if (i.customId === 'previous') {
            currentPageNum = Math.max(0, currentPageNum - 1);
        } else if (i.customId === 'next') {
            currentPageNum = Math.min(pages - 1, currentPageNum + 1);
        } else if (i.customId === 'last') {
            currentPageNum = pages - 1;
        }

        const newEmbed = createEmbed(currentPageNum);
        
        const newRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('first')
                    .setLabel('⏮ First')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPageNum === 0),
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('◀ Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPageNum === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next ▶')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPageNum === pages - 1),
                new ButtonBuilder()
                    .setCustomId('last')
                    .setLabel('Last ⏭')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPageNum === pages - 1)
            );

        await message.edit({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', async () => {
        await message.edit({ components: [] }).catch(() => {});
    });
}

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('listroles')
        .setDescription('List all roles in the server with detailed information')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),

    async execute(
        interaction: ChatInputCommandInteraction,
        client: Client,
        dbGuild: any
    ): Promise<void> {
        await handleListRoles(interaction, client, dbGuild);
    },
};
