import { SlashCommandBuilder, ChatInputCommandInteraction, Client, GuildEmoji, Collection } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('emojis')
        .setDescription('Displays comprehensive emoji statistics and showcases all server emojis.')
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

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const type = interaction.options.getString('type') || 'all';
        const emojis = interaction.guild.emojis.cache;
        const animatedEmojis = emojis.filter((emoji) => !!emoji.animated);
        const staticEmojis = emojis.filter((emoji) => !emoji.animated);

        let displayEmojis: Collection<string, GuildEmoji>;
        let typeName: string;
        let emojiIcon: string;

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

        const premiumTier = interaction.guild.premiumTier;
        const totalSlots = premiumTier === 3 ? 250 : premiumTier === 2 ? 150 : premiumTier === 1 ? 100 : 50;
        const usedSlots = emojis.size;
        const availableSlots = totalSlots - usedSlots;
        const usagePercentage = Math.round((usedSlots / totalSlots) * 100);

        const emojiList = displayEmojis.size > 0
            ? displayEmojis.map(emoji => `${emoji} \`:${emoji.name}:\``).join(' ')
            : `*No ${typeName.toLowerCase()} emojis found*`;

        const embed = EmbedGenerator.basicEmbed()
            .setTitle(`${emojiIcon} ${interaction.guild.name} Emoji Collection`)
            .setDescription(`**${typeName} Emojis Showcase**\n\n${emojiList}`)
            .setColor('#FF6B9D')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 Emoji Statistics',
                    value: `🎬 **Animated:** ${animatedEmojis.size}\n🖼️ **Static:** ${staticEmojis.size}\n🎯 **Total:** ${emojis.size}`,
                    inline: true
                },
                {
                    name: '💾 Server Limits',
                    value: `📦 **Used:** ${usedSlots}/${totalSlots}\n✨ **Available:** ${availableSlots}\n📈 **Usage:** ${usagePercentage}%`,
                    inline: true
                },
                {
                    name: '⭐ Boost Tier',
                    value: `Tier ${premiumTier} • ${totalSlots} slots`,
                    inline: false
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag} • Use /emojiinfo for details`,
                iconURL: interaction.user.displayAvatarURL({ size: 256 } as any)
            })
            .setTimestamp();

        if (displayEmojis.size > 50) {
            embed.addFields({ name: '💡 Tip', value: `Showing ${displayEmojis.size} emojis.`, inline: false });
        }

        return { embeds: [embed] };
    },
};
