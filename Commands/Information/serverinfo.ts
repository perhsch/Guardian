import { PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDefaultMemberPermissions(PermissionFlagsBits.EmbedLinks)
        .setDescription('Get comprehensive information about this server'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const guild = interaction.guild;
        const fetchedOwner = await guild.fetchOwner();
        const serverIcon = guild.iconURL({ size: 256 });
        const banner = guild.bannerURL({ size: 1024 });

        const boostCount = guild.premiumSubscriptionCount ?? 0;
        let boostTier = 'No Boosts';
        let boostColor = 0x747f8d;

        if (boostCount >= 14) {
            boostTier = 'Level 3 🚀';
            boostColor = 0xff73e7;
        } else if (boostCount >= 7) {
            boostTier = 'Level 2 ⚡';
            boostColor = 0xeb459e;
        } else if (boostCount >= 2) {
            boostTier = 'Level 1 ✨';
            boostColor = 0x47a0f2;
        }

        const totalChannels = guild.channels.cache.size;
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;

        const totalRoles = guild.roles.cache.size;
        const adminRoles = guild.roles.cache.filter(r => r.permissions.has(PermissionFlagsBits.Administrator)).size;
        const moderatorRoles = guild.roles.cache.filter(r => r.permissions.has(PermissionFlagsBits.KickMembers) || r.permissions.has(PermissionFlagsBits.BanMembers)).size;

        const emojis = guild.emojis.cache.size;
        const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
        const staticEmojis = emojis - animatedEmojis;

        const memberCount = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const idleMembers = guild.members.cache.filter(m => m.presence?.status === 'idle').size;
        const dndMembers = guild.members.cache.filter(m => m.presence?.status === 'dnd').size;

        const createdAt = guild.createdAt;
        const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        const features = guild.features;
        const featureList = features.length > 0 ? features.map(f => `• ${f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n') : '• None';

        const serverInfoEmbed = new EmbedBuilder()
            .setTitle(`📊 ${guild.name} Server Information`)
            .setDescription(`**Server ID:** \`${guild.id}\`\n**Created:** ${createdAt.toDateString()} (${ageInDays} days ago)`)
            .setThumbnail(serverIcon)
            .setColor(boostColor)
            .setImage(banner)
            .addFields(
                {
                    name: '👥 **Member Statistics**',
                    value: `👥 **Total Members:** ${memberCount.toLocaleString()}\n🟢 **Online:** ${onlineMembers.toLocaleString()}\n🟡 **Idle:** ${idleMembers.toLocaleString()}\n🔴 **Do Not Disturb:** ${dndMembers.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🚀 **Boost Information**',
                    value: `⭐ **Boost Level:** ${boostTier}\n💎 **Total Boosts:** ${boostCount}\n🎨 **Boost Bar Color:** ${boostColor.toString(16)}`,
                    inline: true
                },
                {
                    name: '👑 **Ownership**',
                    value: `👑 **Server Owner:** ${fetchedOwner.user.tag}\n🆔 **Owner ID:** ${fetchedOwner.user.id}`,
                    inline: true
                },
                {
                    name: '💬 **Channel Overview**',
                    value: `📝 **Text Channels:** ${textChannels}\n🔊 **Voice Channels:** ${voiceChannels}\n📁 **Categories:** ${categories}\n📊 **Total Channels:** ${totalChannels}`,
                    inline: true
                },
                {
                    name: '🎭 **Role Statistics**',
                    value: `🎭 **Total Roles:** ${totalRoles}\n👑 **Admin Roles:** ${adminRoles}\n🛡️ **Moderator Roles:** ${moderatorRoles}`,
                    inline: true
                },
                {
                    name: '😀 **Emoji Collection**',
                    value: `😀 **Total Emojis:** ${emojis}\n🎬 **Animated:** ${animatedEmojis}\n📸 **Static:** ${staticEmojis}`,
                    inline: true
                },
                {
                    name: '⚙️ **Server Features**',
                    value: featureList,
                    inline: false
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag} • Server Information`,
                iconURL: interaction.user.displayAvatarURL({ size: 64 })
            })
            .setTimestamp();

        return interaction.reply({ embeds: [serverInfoEmbed] });
    },
};
