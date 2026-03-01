const Discord = require('discord.js');
const EmbedGenerator = require('../../Functions/embedGenerator');
const Infractions = require('../../Schemas/Infractions');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('automodlist')
        .setDescription('List all automod cases that have ever happened in this server')
        .setDefaultMemberPermissions(
            Discord.PermissionFlagsBits.ManageRoles |
                Discord.PermissionFlagsBits.ManageChannels |
                Discord.PermissionFlagsBits.ModerateMembers
        )
        .setDMPermission(false)
        .addIntegerOption(option =>
            option
                .setName('limit')
                .setDescription('Maximum number of cases to show (default: 20, max: 100)')
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Filter by automod action type')
                .addChoices(
                    { name: 'All Types', value: 'all' },
                    { name: 'Warnings', value: 'warning' },
                    { name: 'Timeouts', value: 'timeout' },
                    { name: 'Message Deletions', value: 'delete' }
                )
        ),
    category: 'administrator',
    async execute(interaction, client, dbGuild) {
        const limit = interaction.options.getInteger('limit') || 20;
        const typeFilter = interaction.options.getString('type') || 'all';

        await interaction.deferReply();

        try {
            // Find all infractions where issuer is the bot (automod cases)
            const query = {
                guild: interaction.guild.id,
                issuer: client.user.id
            };

            // Add type filter if specified (but not for 'all' or 'delete' since delete actions don't create infractions)
            if (typeFilter !== 'all' && typeFilter !== 'delete') {
                query.type = typeFilter;
            }

            const automodInfractions = await Infractions.find(query)
                .sort({ time: -1 })
                .limit(limit);

            if (automodInfractions.length === 0) {
                const noCasesEmbed = EmbedGenerator.basicEmbed()
                    .setTitle('🔍 No Automod Cases Found')
                    .setDescription(
                        typeFilter === 'all' 
                            ? 'No automod cases have been recorded in this server yet.'
                            : `No automod ${typeFilter} cases have been recorded in this server yet.`
                    )
                    .setColor('Yellow')
                    .setTimestamp();

                return interaction.editReply({ embeds: [noCasesEmbed] });
            }

            // Group infractions by type for statistics
            const stats = {
                warning: 0,
                timeout: 0,
                total: automodInfractions.length
            };

            automodInfractions.forEach(inf => {
                if (stats[inf.type] !== undefined) {
                    stats[inf.type]++;
                }
            });

            // Create embed with cases
            const embed = EmbedGenerator.basicEmbed()
                .setTitle('🛡️ Automod Cases History')
                .setDescription(
                    `Showing **${automodInfractions.length}** recent automod case${automodInfractions.length === 1 ? '' : 's'}${typeFilter !== 'all' ? ` (${typeFilter})` : ''}\n\n` +
                    `**Statistics:**\n` +
                    `⚠️ Warnings: **${stats.warning}**\n` +
                    `⏰ Timeouts: **${stats.timeout}**\n` +
                    `📊 Total Shown: **${stats.total}**`
                )
                .setColor('Blue')
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            // Add cases as fields
            const casesList = automodInfractions.map((infraction, index) => {
                const date = new Date(infraction.time).toLocaleDateString();
                const time = new Date(infraction.time).toLocaleTimeString();
                const user = `<@${infraction.user}>`;
                
                let actionIcon = '';
                let actionText = '';
                
                switch (infraction.type) {
                    case 'warning':
                        actionIcon = '⚠️';
                        actionText = 'Warning';
                        break;
                    case 'timeout':
                        actionIcon = '⏰';
                        actionText = 'Timeout (1h)';
                        break;
                    default:
                        actionIcon = '🔧';
                        actionText = infraction.type;
                }

                const reason = infraction.reason.length > 50 
                    ? infraction.reason.substring(0, 47) + '...' 
                    : infraction.reason;

                return `**#${index + 1}** ${actionIcon} ${actionText}\n` +
                       `👤 User: ${user}\n` +
                       `📅 Date: ${date} ${time}\n` +
                       `📝 Reason: ${reason}`;
            });

            // Split into chunks if too many cases
            const chunks = [];
            let currentChunk = '';
            
            casesList.forEach((caseText, index) => {
                const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + caseText;
                
                if (testChunk.length > 1024) {
                    if (currentChunk) {
                        chunks.push(currentChunk);
                        currentChunk = caseText;
                    } else {
                        // Single case is too long, truncate it
                        chunks.push(caseText.substring(0, 1021) + '...');
                    }
                } else {
                    currentChunk = testChunk;
                }
            });
            
            if (currentChunk) {
                chunks.push(currentChunk);
            }

            // Add first chunk to main embed
            if (chunks.length > 0) {
                embed.addFields({
                    name: `📋 Cases (1-${Math.min(chunks[0].split('\n\n').length, automodInfractions.length)})`,
                    value: chunks[0],
                    inline: false
                });
            }

            const reply = { embeds: [embed] };

            // Add additional chunks as separate embeds if needed
            if (chunks.length > 1) {
                const additionalEmbeds = [];
                
                for (let i = 1; i < chunks.length; i++) {
                    const chunkStart = chunks.slice(0, i + 1).join('\n\n').split('\n\n').length - chunks[i].split('\n\n').length + 1;
                    const chunkEnd = chunks.slice(0, i + 1).join('\n\n').split('\n\n').length;
                    
                    const additionalEmbed = EmbedGenerator.basicEmbed()
                        .setTitle('🛡️ Automod Cases History (Continued)')
                        .addFields({
                            name: `📋 Cases (${chunkStart}-${Math.min(chunkEnd, automodInfractions.length)})`,
                            value: chunks[i],
                            inline: false
                        })
                        .setColor('Blue')
                        .setTimestamp();
                    
                    additionalEmbeds.push(additionalEmbed);
                }
                
                reply.embeds.push(...additionalEmbeds);
            }

            await interaction.editReply(reply);

        } catch (error) {
            console.error('Error fetching automod cases:', error);
            const errorEmbed = EmbedGenerator.basicEmbed()
                .setTitle('❌ Error')
                .setDescription('An error occurred while fetching automod cases. Please try again later.')
                .setColor('Red');

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
