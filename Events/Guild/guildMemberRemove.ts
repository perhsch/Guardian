import Discord from 'discord.js';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import { GuildsManager } from '../../Classes/GuildsManager.ts';

export default {
    name: 'guildMemberRemove',
    /**
     * @param {Discord.GuildMember | Discord.PartialGuildMember} member
     * @param {Discord.Client} client
     */
    async execute(
        member: Discord.GuildMember | Discord.PartialGuildMember,
        client: Discord.Client
    ) {
        const guild = await GuildsManager.fetch(member.guild.id);
        if (!guild) return;

        if (guild.logs.enabled) {
            const logChannel = await member.guild.channels.fetch(guild.logs.basic_logs!);
            if (!logChannel || !(logChannel instanceof Discord.TextChannel)) return;

            const accountCreation = member.user
                ? Math.floor(member.user.createdTimestamp / 1000)
                : 0;

            logChannel.send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        [
                            `• User: ${member.user}`,
                            `• Account Type: ${member.user?.bot ? 'Bot' : 'User'}`,
                            `• Account Created: <t:${accountCreation}:D> | <t:${accountCreation}:R>`,
                        ].join('\n')
                    )
                        .setAuthor({
                            name: `${member.user?.tag || 'Unknown'} | ${member.id}`,
                            iconURL: member.displayAvatarURL({ forceStatic: false }),
                        })
                        .setThumbnail(member.user?.displayAvatarURL({ size: 256 }) || null)
                        .setFooter({ text: 'Left' })
                        .setTimestamp(),
                ],
            });
        }
    },
};
