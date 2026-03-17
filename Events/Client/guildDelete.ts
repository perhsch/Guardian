import {
    Guild,
    Client,
} from 'discord.js';
import moment from 'moment';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import GuildsModel from '../../Schemas/Guilds.ts';

const LOG_CHANNEL_ID = '1471348003297300662';

export default {
    name: 'guildDelete',
    async execute(guild: Guild, client: Client<true>) {
        try {
            // Delete guild data from database
            await GuildsModel.deleteOne({ guild: guild.id }).catch((error) => {
                console.error(`Failed to delete guild data for ${guild.id}:`, error);
            });

            console.log(`🗑️ Deleted guild data for: ${guild.name} (${guild.id})`);

            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
            if (!logChannel || !logChannel.isTextBased() || !('send' in logChannel)) {
                console.error('Could not find or access the log channel');
                return;
            }

            const createdAt = moment(guild.createdAt).format('MMMM Do YYYY, h:mm:ss a');
            const features = guild.features.length > 0 ? guild.features.join(', ') : 'None';

            const embed = EmbedGenerator.basicEmbed()
                .setTitle('👋 Bot Left Server')
                .setColor('#FF0000')
                .setThumbnail(guild.iconURL({ size: 256 }) || null)
                .addFields(
                    {
                        name: '📋 Server Information',
                        value: `**Name:** ${guild.name}\n` +
                              `**ID:** \`${guild.id}\`\n` +
                              `**Created:** ${createdAt}\n` +
                              `**Features:** ${features}`,
                        inline: false
                    },
                    {
                        name: '📊 Final Stats',
                        value: `**Member Count (at leave):** \`${guild.memberCount}\`\n` +
                              `**Roles:** \`${guild.roles.cache.size}\`\n` +
                              `**Channels:** \`${guild.channels.cache.size}\`\n` +
                              `**Emojis:** \`${guild.emojis.cache.size}\``,
                        inline: true
                    },
                    {
                        name: '📈 Bot Status',
                        value: `**Total Servers Now:** \`${client.guilds.cache.size}\`\n` +
                              `**Change:** \`${client.guilds.cache.size + 1} → ${client.guilds.cache.size}\`\n` +
                              `**Status:** ⬇️ Decreased`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Total Servers: ${client.guilds.cache.size} • Guardian Bot`,
                    iconURL: client.user?.displayAvatarURL({ size: 64 }) || undefined
                })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
            
            console.log(`❌ Left server: ${guild.name} (${guild.id})`);
        } catch (error) {
            console.error('Error in guildDelete event:', error);
        }
    },
};
