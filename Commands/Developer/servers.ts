import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Client,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits,
    TextChannel,
    ButtonInteraction,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

const activeCollectors = new Set<any>();

export default {
    enabled: true,
    developer: true,
    data: new SlashCommandBuilder()
        .setName('listservers')
        .setDescription('Lists all servers the bot is in.'),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        // Check if user is a developer
        const developerIds = ['1447738202600505407']; // Add your developer IDs here
        if (!developerIds.includes(interaction.user.id)) {
            await interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('❌ This command is restricted to developers only.')],
                ephemeral: true
            });
            return;
        }

        if (!interaction.channel) return;

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

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('join_server')
                .setLabel('Join Server')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔗')
        );

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = (i: ButtonInteraction) =>
            i.user.id === interaction.user.id && i.customId === 'join_server';
        const collector = (interaction.channel as TextChannel).createMessageComponentCollector({
            filter: filter as any,
            time: 60000,
        });

        collector.on('collect', async (buttonInteraction) => {
            await buttonInteraction.reply({
                content: '🔍 What is the server ID you want to join?',
                ephemeral: true,
            });

            const channelForMsg = buttonInteraction.channel as TextChannel | null;
            if (!channelForMsg) return;

            const messageCollector = channelForMsg.createMessageCollector({
                filter: (m) => m.author.id === buttonInteraction.user.id,
                time: 30000,
                max: 1,
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
                            c.type === ChannelType.GuildText &&
                            c
                                .permissionsFor(guild.members.me!)
                                ?.has(PermissionFlagsBits.CreateInstantInvite)
                    );

                    if (channels.size === 0) {
                        await buttonInteraction.followUp({
                            content: `❌ I don't have permission to create invites in **${guild.name}**.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const channel = channels.first() as TextChannel;
                    const invite = await channel.createInvite({
                        maxAge: 0,
                        maxUses: 1,
                        unique: true,
                    });

                    const developer = await client.users.fetch('1447738202600505407');
                    const devEmbed = new EmbedBuilder()
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
                        content: `❌ Failed to create invite for server ID \`${guildId}\`. Please check the permissions.`,
                        ephemeral: true,
                    });
                }
            });

            messageCollector.on('end', (_collected, reason) => {
                activeCollectors.delete(messageCollector);
                if (reason === 'time') {
                    buttonInteraction.followUp({
                        content: '⏰ Time expired. Please try again.',
                        ephemeral: true,
                    });
                }
            });
        });

        collector.on('end', (_collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({ components: [] }).catch(() => {});
            }
        });
    },
};
