import {
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Client,
    Message,
    MessageReaction,
    User,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Start an interactive poll')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .addStringOption((option) =>
            option
                .setName('question')
                .setDescription('The poll question')
                .setRequired(true)
                .setMaxLength(256)
        )
        .addStringOption((option) =>
            option
                .setName('option1')
                .setDescription('First poll option')
                .setRequired(true)
                .setMaxLength(100)
        )
        .addStringOption((option) =>
            option
                .setName('option2')
                .setDescription('Second poll option')
                .setRequired(true)
                .setMaxLength(100)
        )
        .addStringOption((option) =>
            option
                .setName('option3')
                .setDescription('Third poll option (optional)')
                .setRequired(false)
                .setMaxLength(100)
        )
        .addStringOption((option) =>
            option
                .setName('option4')
                .setDescription('Fourth poll option (optional)')
                .setRequired(false)
                .setMaxLength(100)
        )
        .addStringOption((option) =>
            option
                .setName('option5')
                .setDescription('Fifth poll option (optional)')
                .setRequired(false)
                .setMaxLength(100)
        )
        .addStringOption((option) =>
            option
                .setName('option6')
                .setDescription('Sixth poll option (optional)')
                .setRequired(false)
                .setMaxLength(100)
        )
        .addStringOption((option) =>
            option
                .setName('option7')
                .setDescription('Seventh poll option (optional)')
                .setRequired(false)
                .setMaxLength(100)
        )
        .addStringOption((option) =>
            option
                .setName('option8')
                .setDescription('Eighth poll option (optional)')
                .setRequired(false)
                .setMaxLength(100)
        )
        .addStringOption((option) =>
            option
                .setName('option9')
                .setDescription('Ninth poll option (optional)')
                .setRequired(false)
                .setMaxLength(100)
        )
        .addIntegerOption((option) =>
            option
                .setName('duration')
                .setDescription('Poll duration in minutes (optional, default: unlimited)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10080)
        ),
    cooldownTime: 20 * 1000,

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.channel) return;

        const question = interaction.options.getString('question', true);
        const duration = interaction.options.getInteger('duration');

        const allOptions: string[] = [];
        for (let i = 1; i <= 9; i++) {
            const option = interaction.options.getString(`option${i}`);
            if (option) {
                allOptions.push(option);
            }
        }

        if (allOptions.length < 2) {
            return interaction.reply({
                content: '❌ You need at least 2 poll options!',
                ephemeral: true,
            });
        }

        const buildPollEmbed = (votes: Record<number, number> | null = null): EmbedBuilder => {
            const embed = EmbedGenerator.basicEmbed()
                .setColor(0x5865f2)
                .setTitle(`📊 ${question}`)
                .setAuthor({
                    name: `Poll by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/1995/1995467.png');

            if (!votes) {
                allOptions.forEach((option, index) => {
                    embed.addFields({
                        name: `${numberEmojis[index]} ${option}`,
                        value: `${'▮'.repeat(0)}▯▯▯▯▯▯▯▯▯▯ 0 votes (0%)`,
                        inline: false,
                    });
                });
            } else {
                const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
                allOptions.forEach((option, index) => {
                    const voteCount = votes[index] || 0;
                    const percentage =
                        totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0';
                    const filledBars = Math.round((parseFloat(percentage) / 100) * 20);
                    const emptyBars = 20 - filledBars;
                    const bar = '▮'.repeat(filledBars) + '▯'.repeat(emptyBars);

                    embed.addFields({
                        name: `${numberEmojis[index]} ${option}`,
                        value: `${bar} **${voteCount}** vote${voteCount !== 1 ? 's' : ''} (**${percentage}%**)`,
                        inline: false,
                    });
                });
            }

            embed.addFields({
                name: '⏱️ Duration',
                value: duration
                    ? `${duration} minute${duration > 1 ? 's' : ''}`
                    : `∞ Unlimited (Never ends)`,
                inline: true,
            });

            embed
                .setFooter({
                    text: votes
                        ? `Poll Ended • ${Object.values(votes).reduce((a, b) => a + b, 0)} total votes`
                        : 'React to vote!',
                })
                .setTimestamp();

            return embed;
        };

        const pollMessage = (await interaction.reply({
            embeds: [buildPollEmbed()],
            fetchReply: true,
        })) as Message;

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Channel: <#${interaction.channel.id}>`,
                `- Question: ${question}`,
                `- Options: ${allOptions.length}`,
                `- Duration: ${duration ? duration + ' minutes' : 'Unlimited'}`,
            ].join('\n')
        ).setTitle('/poll command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        for (let i = 0; i < allOptions.length; i++) {
            await pollMessage.react(numberEmojis[i]!);
            await new Promise((resolve) => setTimeout(resolve, 300));
        }

        const updateVotes = async () => {
            try {
                const updatedMessage = await pollMessage.channel.messages.fetch(pollMessage.id);
                const votes: Record<number, number> = {};

                updatedMessage.reactions.cache.forEach((reaction) => {
                    const emojiIndex = numberEmojis.indexOf(reaction.emoji.name!);
                    if (emojiIndex !== -1) {
                        votes[emojiIndex] = Math.max(0, (reaction.count || 0) - 1);
                    }
                });

                for (let i = 0; i < allOptions.length; i++) {
                    if (votes[i] === undefined) {
                        votes[i] = 0;
                    }
                }

                const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
                if (totalVotes > 0) {
                    await pollMessage.edit({ embeds: [buildPollEmbed(votes)] });
                }
            } catch (error) {
                console.error('Error updating poll:', error);
            }
        };

        const reactionAddListener = async (reaction: MessageReaction, user: User) => {
            if (reaction.message.id !== pollMessage.id || user.bot) return;
            await updateVotes();
        };

        const reactionRemoveListener = async (reaction: MessageReaction, user: User) => {
            if (reaction.message.id !== pollMessage.id || user.bot) return;
            await updateVotes();
        };

        interaction.client.on('messageReactionAdd', reactionAddListener);
        interaction.client.on('messageReactionRemove', reactionRemoveListener);

        const cleanup = () => {
            interaction.client.removeListener('messageReactionAdd', reactionAddListener);
            interaction.client.removeListener('messageReactionRemove', reactionRemoveListener);
        };

        if (duration) {
            const durationMs = duration * 60 * 1000;
            setTimeout(async () => {
                cleanup();

                try {
                    const updatedMessage = await pollMessage.channel.messages.fetch(pollMessage.id);
                    const votes: Record<number, number> = {};

                    updatedMessage.reactions.cache.forEach((reaction) => {
                        const emojiIndex = numberEmojis.indexOf(reaction.emoji.name!);
                        if (emojiIndex !== -1) {
                            votes[emojiIndex] = Math.max(0, (reaction.count || 0) - 1);
                        }
                    });

                    for (let i = 0; i < allOptions.length; i++) {
                        if (votes[i] === undefined) {
                            votes[i] = 0;
                        }
                    }

                    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
                    const resultsEmbed = EmbedGenerator.basicEmbed()
                        .setColor(0x2ecc71)
                        .setTitle(`✅ Poll Results: ${question}`)
                        .setAuthor({
                            name: `Poll by ${interaction.user.username}`,
                            iconURL: interaction.user.displayAvatarURL(),
                        })
                        .setThumbnail('https://cdn-icons-png.flaticon.com/512/1995/1995467.png');

                    const maxVotes = Math.max(...Object.values(votes));
                    const winner = allOptions.find((_, idx) => votes[idx] === maxVotes);

                    allOptions.forEach((option, index) => {
                        const voteCount = votes[index] || 0;
                        const percentage =
                            totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0';
                        const filledBars = Math.round((parseFloat(percentage) / 100) * 20);
                        const emptyBars = 20 - filledBars;
                        const bar = '▮'.repeat(filledBars) + '▯'.repeat(emptyBars);

                        resultsEmbed.addFields({
                            name: `${numberEmojis[index]} ${option}`,
                            value: `${bar} **${voteCount}** vote${voteCount !== 1 ? 's' : ''} (**${percentage}%**)`,
                            inline: false,
                        });
                    });

                    resultsEmbed
                        .addFields({
                            name: '🏆 Winner',
                            value:
                                totalVotes > 0
                                    ? `**${winner}** with ${maxVotes} vote${maxVotes !== 1 ? 's' : ''}`
                                    : 'No votes cast',
                            inline: false,
                        })
                        .setFooter({
                            text: `Poll Ended • Total votes: ${totalVotes}`,
                        })
                        .setTimestamp();

                    await pollMessage.reply({ embeds: [resultsEmbed] });
                } catch (error) {
                    console.error('Error calculating poll results:', error);
                }
            }, durationMs);
        }
    },
};
