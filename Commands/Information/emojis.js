const Discord = require(`discord.js`);

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('emojis')
        .setDescription('Displays comprehensive emoji statistics and showcases all server emojis.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.EVERYONE)
        .setDMPermission(false)
        .addStringOption((option) =>
            option.setName('type')
                .setDescription('Filter emojis by type')
                .addChoices(
                    { name: '🎬 Animated Only', value: 'animated' },
                    { name: '🖼️ Static Only', value: 'static' },
                    { name: '🎯 All Emojis', value: 'all' }
                )
        ),
    async execute(interaction, client, dbGuild) {
        const type = interaction.options.getString('type') || 'all';
        const emojis = interaction.guild.emojis.cache;
        const animatedEmojis = emojis.filter((emoji) => emoji.animated);
        const staticEmojis = emojis.filter((emoji) => !emoji.animated);

        let displayEmojis;
        let typeName;
        let emojiIcon;

        switch (type) {
            case 'animated':
                displayEmojis = animatedEmojis;
                typeName = 'Animated';
                emojiIcon = '🎬';
                break;
            case 'static':
                displayEmojis = staticEmojis;
                typeName = 'Static';
                emojiIcon = '🖼️';
                break;
            default:
                displayEmojis = emojis;
                typeName = 'All';
                emojiIcon = '🎯';
        }

        // Calculate statistics
        const totalSlots = interaction.guild.premiumTier ?
            (interaction.guild.premiumTier === 'TIER_1' ? 100 :
                interaction.guild.premiumTier === 'TIER_2' ? 150 :
                    interaction.guild.premiumTier === 'TIER_3' ? 250 : 50) : 50;

        const usedSlots = emojis.size;
        const availableSlots = totalSlots - usedSlots;
        const usagePercentage = Math.round((usedSlots / totalSlots) * 100);

        // Create emoji display string
        const emojiList = displayEmojis.size > 0 ?
            displayEmojis.map(emoji => `${emoji} \`:${emoji.name}:\``).join(' ') :
            `*No ${typeName.toLowerCase()} emojis found*`;

        // Create embed
        const embed = new EmbedGenerator.basicEmbed()
            .setTitle(`${emojiIcon} ${interaction.guild.name} Emoji Collection`)
            .setDescription(
                `**${typeName} Emojis Showcase**\n\n${emojiList}`
            )
            .setColor('#FF6B9D')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 Emoji Statistics',
                    value: `🎬 **Animated:** ${animatedEmojis.size}\n` +
                        `🖼️ **Static:** ${staticEmojis.size}\n` +
                        `🎯 **Total:** ${emojis.size}`,
                    inline: true
                },
                {
                    name: '💾 Server Limits',
                    value: `📦 **Used:** ${usedSlots}/${totalSlots}\n` +
                        `✨ **Available:** ${availableSlots}\n` +
                        `📈 **Usage:** ${usagePercentage}%`,
                    inline: true
                },
                {
                    name: '⭐ Boost Tier',
                    value: `${interaction.guild.premiumTier ?
                        `Level ${interaction.guild.premiumTier.slice(-1)}` :
                        'No Boost'} • ${totalSlots} slots`,
                    inline: false
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag} • Use /emojiinfo for details`,
                iconURL: interaction.user.displayAvatarURL({ size: 256 })
            })
            .setTimestamp();

        // Handle large emoji lists with pagination hint
        if (displayEmojis.size > 50) {
            embed.addFields({
                name: '💡 Tip',
                value: `Showing ${displayEmojis.size} emojis.`,
                inline: false
            });
        }

        return { embeds: [embed] };
    },
};
