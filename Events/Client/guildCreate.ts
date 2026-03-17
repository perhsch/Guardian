import {
    Guild,
    Client,
    ChannelType,
} from 'discord.js';
import moment from 'moment';
import EmbedGenerator from '../../Functions/embedGenerator.ts';

const LOG_CHANNEL_ID = '1471348003297300662';

export default {
    name: 'guildCreate',
    async execute(guild: Guild, client: Client<true>) {
        try {
            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
            if (!logChannel || !logChannel.isTextBased() || !('send' in logChannel)) {
                console.error('Could not find or access the log channel');
                return;
            }

            const owner = await guild.fetchOwner().catch(() => null);
            const memberCount = guild.memberCount;
            const createdAt = moment(guild.createdAt).format('MMMM Do YYYY, h:mm:ss a');
            const features = guild.features.length > 0 ? guild.features.join(', ') : 'None';
            
            const members = await guild.members.fetch().catch(() => null);
            const botCount = members?.filter((member: any) => member.user.bot).size || 0;
            const humanCount = memberCount - botCount;

            const textChannels = guild.channels.cache.filter((c: any) => c.type === ChannelType.GuildText).size;
            const voiceChannels = guild.channels.cache.filter((c: any) => c.type === ChannelType.GuildVoice).size;
            const categoryChannels = guild.channels.cache.filter((c: any) => c.type === ChannelType.GuildCategory).size;
            const roleCount = guild.roles.cache.size;

            const embed = EmbedGenerator.basicEmbed()
                .setTitle('🎉 Bot Joined New Server')
                .setColor('#00FF00')
                .setThumbnail(guild.iconURL({ size: 256 }) || null)
                .addFields(
                    {
                        name: '📋 Server Information',
                        value: `**Name:** ${guild.name}\n` +
                              `**ID:** \`${guild.id}\`\n` +
                              `**Owner:** ${owner ? `${owner.user.tag} (${owner.id})` : 'Unknown'}\n` +
                              `**Created:** ${createdAt}\n` +
                              `**Features:** ${features}`,
                        inline: false
                    },
                    {
                        name: '👥 Member Statistics',
                        value: `**Total Members:** \`${memberCount}\`\n` +
                              `**Humans:** \`${humanCount}\`\n` +
                              `**Bots:** \`${botCount}\`\n` +
                              `**Boost Level:** \`${guild.premiumTier}\`\n` +
                              `**Boosts:** \`${guild.premiumSubscriptionCount || 0}\``,
                        inline: true
                    },
                    {
                        name: '📊 Server Stats',
                        value: `**Text Channels:** \`${textChannels}\`\n` +
                              `**Voice Channels:** \`${voiceChannels}\`\n` +
                              `**Categories:** \`${categoryChannels}\`\n` +
                              `**Roles:** \`${roleCount}\`\n` +
                              `**Emojis:** \`${guild.emojis.cache.size}\``,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Total Servers: ${client.guilds.cache.size} • Guardian Bot`,
                    iconURL: client.user?.displayAvatarURL({ size: 64 }) || undefined
                })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
            
            console.log(`✅ Joined new server: ${guild.name} (${guild.id})`);
        } catch (error) {
            console.error('Error in guildCreate event:', error);
        }
    },
};
