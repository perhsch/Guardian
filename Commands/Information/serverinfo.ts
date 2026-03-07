import { PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDefaultMemberPermissions(PermissionFlagsBits.EmbedLinks)
        .setDescription('Receive information about the current guild'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const serverIcon = interaction.guild.iconURL();
        const boostCount = interaction.guild.premiumSubscriptionCount ?? 0;
        let boostTier = 0;

        if (boostCount >= 14) boostTier = 3;
        else if (boostCount >= 7) boostTier = 2;
        else if (boostCount >= 2) boostTier = 1;

        const fetchedOwner = await interaction.guild.fetchOwner();

        const replyEmbed = EmbedGenerator.basicEmbed()
            .setColor('Blue')
            .setAuthor({ name: `${interaction.guild.name}`, iconURL: serverIcon ?? undefined })
            .setThumbnail(serverIcon)
            .addFields(
                {
                    name: 'General information',
                    value: `*Owner:* \`${fetchedOwner.user.tag}\`\n*Member count:* \`${interaction.guild.memberCount}\`\n*Boosts:* \`${boostCount}\``,
                    inline: true,
                },
                {
                    name: 'Other',
                    value: `*Roles:* \`${interaction.guild.roles.cache.size - 1}\`\n*Boost tier:* \`${boostTier}\`\n*Channels:* \`${interaction.guild.channels.channelCountWithoutThreads}\``,
                    inline: true,
                }
            )
            .setFooter({ text: `${interaction.guild.id}` })
            .setTimestamp();

        return interaction.reply({ embeds: [replyEmbed] });
    },
};
