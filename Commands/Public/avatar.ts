import { SlashCommandBuilder, ChatInputCommandInteraction, Client, GuildMember } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDMPermission(false)
        .setDescription('Gets the avatar of a user')
        .addUserOption((option) =>
            option.setName('user').setDescription('The user to get the avatar of')
        ),

    execute(interaction: ChatInputCommandInteraction, _client: Client) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild?.members.cache.get(user.id) as GuildMember | undefined;

        const embed = EmbedGenerator.basicEmbed()
            .setTitle(`🖼️ ${user.username}'s Avatar`)
            .setDescription(
                `**User Information:**\n` +
                    `🏷️ **Tag:** \`${user.tag}\`\n` +
                    `🆔 **ID:** \`${user.id}\`\n` +
                    `📅 **Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>\n` +
                    (member
                        ? `🎯 **Joined:** <t:${Math.floor((member.joinedTimestamp ?? 0) / 1000)}:R>\n`
                        : '') +
                    (member?.nickname ? `🔖 **Nickname:** \`${member.nickname}\`\n` : '') +
                    `\n**Avatar Links:**\n` +
                    `🔗 [Full Size (4096x4096)](${user.displayAvatarURL({ size: 4096, extension: 'png' })})\n` +
                    `🔗 [Medium Size (1024x1024)](${user.displayAvatarURL({ size: 1024, extension: 'png' })})\n` +
                    `🔗 [Small Size (256x256)](${user.displayAvatarURL({ size: 256, extension: 'png' })})`
            )
            .setImage(user.displayAvatarURL({ size: 1024, extension: 'png' }))
            .setThumbnail(user.displayAvatarURL({ size: 256, extension: 'png' }))
            .setColor((member?.displayHexColor as any) || '#00AE86')
            .setFooter({
                text: `Requested by ${interaction.user.tag} • Click any link to download`,
                iconURL: interaction.user.displayAvatarURL({ size: 256 }),
            })
            .setTimestamp();

        return { embeds: [embed] };
    },
};
