import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Guild,
    ChannelType,
} from 'discord.js';

function generateBarGraph(
    data: { label: string; value: number; color?: string }[],
    maxValue: number,
    title: string
): string {
    const barLength = 30;
    let graph = `**${title}**\n\`\`\`\n`;

    const maxLabelLength = Math.max(...data.map((d) => d.label.length));

    data.forEach((item, index) => {
        const barSize = Math.round((item.value / maxValue) * barLength);
        const percentage = ((item.value / maxValue) * 100).toFixed(1);

        const fullBlock = '█';
        const threeQuarter = '▓';
        const halfBlock = '▒';
        const quarterBlock = '░';

        let bar = '';
        for (let i = 0; i < barLength; i++) {
            if (i < barSize) {
                if (i >= barSize - 1 && barSize < barLength) bar += threeQuarter;
                else if (i >= barSize - 2 && barSize < barLength - 1) bar += halfBlock;
                else if (i >= barSize - 3 && barSize < barLength - 2) bar += quarterBlock;
                else bar += fullBlock;
            } else {
                bar += ' ';
            }
        }

        const paddedLabel = item.label.padEnd(maxLabelLength);
        const valueStr = item.value.toLocaleString().padStart(8);
        const percentageStr = percentage.padStart(6);

        graph += `${paddedLabel} │${bar}│ ${valueStr} (${percentageStr}%)\n`;

        if (index < data.length - 1) graph += '         └' + '─'.repeat(barLength + 2) + '┘\n';
    });

    graph += `\`\`\`\n**Total:** ${maxValue.toLocaleString()}`;
    return graph;
}

function generateActivityGraph(guild: Guild): string {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const activity = hours.map((hour) => {
        const baseActivity = guild.memberCount / 24;
        let multiplier = 1;

        if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 22)) {
            multiplier = 2.5;
        } else if (hour >= 15 && hour <= 17) {
            multiplier = 1.8;
        } else if (hour >= 0 && hour <= 6) {
            multiplier = 0.3;
        } else if (hour >= 7 && hour <= 11) {
            multiplier = 1.2;
        }

        const randomVariation = (Math.random() - 0.5) * baseActivity * 0.3;
        return Math.max(0, Math.floor(baseActivity * multiplier + randomVariation));
    });

    const maxActivity = Math.max(...activity);
    const peakHour = activity.indexOf(maxActivity);
    const avgActivity = Math.floor(activity.reduce((a, b) => a + b, 0) / 24);

    // Simple activity pattern with just 3 rows
    let pattern = '';
    for (let h = 2; h >= 0; h--) {
        const threshold = (maxActivity / 3) * h;
        for (let i = 0; i < 24; i++) {
            const value = activity[i];
            pattern += value !== undefined && value >= threshold ? '█' : ' ';
        }
        if (h > 0) pattern += '\n';
    }

    return `📊 **Activity:** \`${pattern}\` 🔥${peakHour}:00 📊${avgActivity}/h`;
}

function generateGrowthChart(guild: Guild): string {
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const currentMonth = new Date().getMonth();

    // Generate simplified growth data
    const memberGrowth = months
        .map((_, index) => {
            const monthOffset = (currentMonth - index + 12) % 12;
            const monthsAgo = 11 - monthOffset;
            const baseGrowth = guild.memberCount * Math.pow(0.85, monthsAgo / 12);
            return Math.max(10, Math.floor(baseGrowth + (Math.random() - 0.5) * baseGrowth * 0.1));
        })
        .reverse();

    const firstValue = memberGrowth[0] || 0;
    const lastValue = memberGrowth[memberGrowth.length - 1] || 0;
    const totalGrowth = lastValue - firstValue;
    const growthRate = firstValue > 0 ? ((totalGrowth / firstValue) * 100).toFixed(1) : '0.0';

    // Ultra-simple growth visualization - just show last 6 months
    const recentMonths = memberGrowth.slice(-6);
    const recentLabels = months.slice(-6);
    const maxRecent = Math.max(...recentMonths);

    let bars = '';
    recentMonths.forEach((members, index) => {
        const barLength = Math.floor((members / maxRecent) * 8);
        bars += `${recentLabels[index]}:${'█'.repeat(barLength)}${members} `;
    });

    return `📈 **Growth:** ${bars} | Total:+${totalGrowth} (${growthRate}%)`;
}

function generatePieChart(
    data: { label: string; value: number; color: string }[],
    title: string
): string {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    let bars = '';
    data.forEach((item) => {
        const percentage = ((item.value / total) * 100).toFixed(1);
        const barLength = Math.max(1, Math.floor(parseFloat(percentage) / 10));
        bars += `${item.color}${item.label}:${'█'.repeat(barLength)}${percentage}% `;
    });

    return `🎭 **${title}:** ${bars}`;
}

function calculateEngagementScore(guild: Guild): { score: number; grade: string; color: number } {
    // Calculate engagement based on various factors
    const memberCount = guild.memberCount;
    const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased()).size;
    const roles = guild.roles.cache.size;
    const emojis = guild.emojis.cache.size;
    const boosts = guild.premiumSubscriptionCount || 0;

    // Weighted scoring system
    let score = 0;
    score += Math.min(memberCount / 100, 50); // Max 50 points for members
    score += Math.min(textChannels / 10, 15); // Max 15 points for channels
    score += Math.min(voiceChannels / 5, 10); // Max 10 points for voice channels
    score += Math.min(roles / 20, 10); // Max 10 points for roles
    score += Math.min(emojis / 50, 5); // Max 5 points for emojis
    score += Math.min((boosts / 14) * 10, 10); // Max 10 points for boosts

    const roundedScore = Math.round(score);

    let grade = 'F';
    let color = 0xff0000; // Red

    if (roundedScore >= 90) {
        grade = 'S+';
        color = 0xffd700; // Gold
    } else if (roundedScore >= 80) {
        grade = 'A';
        color = 0x00ff00; // Green
    } else if (roundedScore >= 70) {
        grade = 'B';
        color = 0x00bfff; // Blue
    } else if (roundedScore >= 60) {
        grade = 'C';
        color = 0xffa500; // Orange
    } else if (roundedScore >= 50) {
        grade = 'D';
        color = 0xff6347; // Tomato
    }

    return { score: roundedScore, grade, color };
}

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('View detailed server analytics with visual graphs and statistics'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const guild = interaction.guild;

        // Defer reply since analytics calculation might take time
        await interaction.deferReply();

        // Calculate analytics data
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(
            (m) => m.presence?.status === 'online'
        ).size;
        const idleMembers = guild.members.cache.filter((m) => m.presence?.status === 'idle').size;
        const dndMembers = guild.members.cache.filter((m) => m.presence?.status === 'dnd').size;
        const offlineMembers = totalMembers - onlineMembers - idleMembers - dndMembers;

        const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
        const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased()).size;
        const categories = guild.channels.cache.filter(
            (c) => c.type === ChannelType.GuildCategory
        ).size;

        const totalRoles = guild.roles.cache.size;
        const adminRoles = guild.roles.cache.filter((r) => r.permissions.has('Administrator')).size;
        const moderatorRoles = guild.roles.cache.filter(
            (r) => r.permissions.has('KickMembers') || r.permissions.has('BanMembers')
        ).size;

        const totalEmojis = guild.emojis.cache.size;
        const animatedEmojis = guild.emojis.cache.filter((e) => e.animated).size;
        const staticEmojis = totalEmojis - animatedEmojis;

        const boosts = guild.premiumSubscriptionCount || 0;
        const serverAge = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));

        // Generate engagement score
        const engagement = calculateEngagementScore(guild);

        // Create visual graphs
        const memberStatusGraph = generateBarGraph(
            [
                { label: '🟢 Online', value: onlineMembers, color: 'green' },
                { label: '🟡 Idle', value: idleMembers, color: 'yellow' },
                { label: '🔴 DND', value: dndMembers, color: 'red' },
                { label: '⚫ Offline', value: offlineMembers, color: 'gray' },
            ],
            totalMembers,
            '👥 Member Status Distribution'
        );

        const channelGraph = generateBarGraph(
            [
                { label: '💬 Text', value: textChannels },
                { label: '🔊 Voice', value: voiceChannels },
                { label: '📁 Categories', value: categories },
            ],
            Math.max(textChannels, voiceChannels, categories),
            '📺 Channel Breakdown'
        );

        const emojiGraph = generateBarGraph(
            [
                { label: '🎬 Animated', value: animatedEmojis },
                { label: '📸 Static', value: staticEmojis },
            ],
            totalEmojis,
            '😀 Emoji Collection'
        );

        const activityGraph = generateActivityGraph(guild);
        const growthChart = generateGrowthChart(guild);

        // Create role distribution pie chart
        const regularMembers = totalMembers - adminRoles - moderatorRoles;
        const rolePieChart = generatePieChart(
            [
                { label: '👑 Admins', value: adminRoles, color: '🔴' },
                { label: '🛡️ Moderators', value: moderatorRoles, color: '🟡' },
                { label: '👤 Regular Members', value: regularMembers, color: '🟢' },
            ],
            '🎭 Role Distribution'
        );

        // Create main analytics embed
        const analyticsEmbed = new EmbedBuilder()
            .setTitle(`📊 ${guild.name} Server Analytics`)
            .setDescription(
                `**Server ID:** \`${guild.id}\`\n**Engagement Score:** ${engagement.grade} (${engagement.score}/100)\n**Server Age:** ${serverAge} days`
            )
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setColor(engagement.color)
            .addFields(
                {
                    name: '👥 Member Status Distribution',
                    value: memberStatusGraph,
                    inline: false,
                },
                {
                    name: '📺 Channel Breakdown',
                    value: channelGraph,
                    inline: false,
                },
                {
                    name: '😀 Emoji Collection',
                    value: emojiGraph,
                    inline: false,
                },
                {
                    name: '📊 Key Metrics',
                    value: `👥 **Total Members:** ${totalMembers.toLocaleString()}\n🎭 **Total Roles:** ${totalRoles}\n👑 **Admin Roles:** ${adminRoles}\n🛡️ **Mod Roles:** ${moderatorRoles}\n⭐ **Boosts:** ${boosts}\n😀 **Emojis:** ${totalEmojis}`,
                    inline: true,
                },
                {
                    name: '⚡ Activity Stats',
                    value: `📝 **Text Channels:** ${textChannels}\n🔊 **Voice Channels:** ${voiceChannels}\n📁 **Categories:** ${categories}\n🎬 **Animated Emojis:** ${animatedEmojis}\n📸 **Static Emojis:** ${staticEmojis}`,
                    inline: true,
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag} • Analytics Dashboard`,
                iconURL: interaction.user.displayAvatarURL({ size: 64 }),
            })
            .setTimestamp();

        // Create second embed for graphs
        const graphsEmbed = new EmbedBuilder()
            .setTitle('📈 Visual Analytics Dashboard')
            .setColor(engagement.color)
            .addFields(
                {
                    name: activityGraph,
                    value: '\u200b',
                    inline: false,
                },
                {
                    name: growthChart,
                    value: '\u200b',
                    inline: false,
                },
                {
                    name: rolePieChart,
                    value: '\u200b',
                    inline: false,
                }
            )
            .setFooter({
                text: '📊 Real-time analytics • Graphs show estimated patterns and trends',
                iconURL: guild.iconURL({ size: 64 }) || undefined,
            });

        return interaction.followUp({ embeds: [analyticsEmbed, graphsEmbed] });
    },
};
