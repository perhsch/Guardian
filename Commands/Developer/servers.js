const Discord = require(`discord.js`);

const EmbedGenerator = require('../../Functions/embedGenerator');

// Store active collectors for join requests
const activeCollectors = new Set();

module.exports = {
    enabled: true,
    developer: true,
    data: new Discord.SlashCommandBuilder()
        .setName('listservers')
        .setDescription('Lists all servers the bot is in.'),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const guilds = client.guilds.cache
            .map(
                (guild) =>
                    `**${guild.name}**\n└ ID: \`${guild.id}\`\n└ Members: ${guild.memberCount}`
            )
            .join('\n\n');

        const embed = EmbedGenerator.basicEmbed()
            .setTitle('🌐 List of Servers')
            .setDescription(guilds)
            .setColor('#0099ff')
            .setFooter({ text: `Total Servers: ${client.guilds.cache.size}` });

        const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('join_server')
                .setLabel('Join Server')
                .setStyle(Discord.ButtonStyle.Primary)
                .setEmoji('🔗')
        );

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = (i) => i.user.id === interaction.user.id && i.customId === 'join_server';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 60000, // 1 minute timeout
        });

        collector.on('collect', async (buttonInteraction) => {
            await buttonInteraction.reply({
                content: '🔍 What is the server ID you want to join?',
                ephemeral: true,
            });

            // Create message collector for the server ID
            const messageFilter = (m) => m.author.id === buttonInteraction.user.id;
            const messageCollector = buttonInteraction.channel.createMessageCollector({
                messageFilter,
                time: 30000, // 30 seconds timeout
                max: 1, // Only collect one message
            });

            activeCollectors.add(messageCollector);

            messageCollector.on('collect', async (m) => {
                const guildId = m.content.trim();

                try {
                    const guild = client.guilds.cache.get(guildId);

                    if (!guild) {
                        await buttonInteraction.followUp({
                            content: `❌ I'm not in a server with ID \`${guildId}\`. Please check the ID and try again.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const channels = guild.channels.cache.filter(
                        (c) =>
                            c.type === Discord.ChannelType.GuildText &&
                            c
                                .permissionsFor(guild.members.me)
                                .has(Discord.PermissionFlagsBits.CreateInstantInvite)
                    );

                    if (channels.size === 0) {
                        await buttonInteraction.followUp({
                            content: `❌ I don't have permission to create invites in **${guild.name}**. Please give me the appropriate permissions.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const channel = channels.first();
                    const invite = await channel.createInvite({
                        maxAge: 0, // Never expires
                        maxUses: 1, // Single use
                        unique: true,
                    });

                    const developer = await client.users.fetch('1447738202600505407');
                    const devEmbed = new Discord.EmbedBuilder()
                        .setTitle('🔗 Server Join Request')
                        .setDescription(
                            `**${buttonInteraction.user.tag}** requested to join a server.`
                        )
                        .addFields(
                            { name: 'Server', value: `${guild.name} (${guild.id})`, inline: true },
                            {
                                name: 'Requested by',
                                value: buttonInteraction.user.tag,
                                inline: true,
                            },
                            {
                                name: 'Invite Link',
                                value: `[Click to Join](${invite.url})`,
                                inline: false,
                            }
                        )
                        .setColor('#00ff00')
                        .setTimestamp();

                    await developer.send({ embeds: [devEmbed] });

                    await buttonInteraction.followUp({
                        content: `✅ Invite link for **${guild.name}** has been sent to the developer!`,
                        ephemeral: true,
                    });

                    await m.delete().catch(() => {});
                } catch (error) {
                    console.error('Error creating invite:', error);
                    await buttonInteraction.followUp({
                        content: `❌ Failed to create invite for server ID \`${guildId}\`. Please check the server permissions.`,
                        ephemeral: true,
                    });
                }
            });

            messageCollector.on('end', (collected, reason) => {
                activeCollectors.delete(messageCollector);

                if (reason === 'time') {
                    buttonInteraction.followUp({
                        content: '⏰ Time expired. Please try again.',
                        ephemeral: true,
                    });
                }
            });
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({ components: [] }).catch(() => {});
            }
        });
    },
};
