import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Client,
    TextChannel,
    EmbedBuilder,
} from 'discord.js';
import { Profanity } from '@2toad/profanity';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('Send feedback to help improve the bot')
        .addStringOption((option) =>
            option
                .setName('feedback')
                .setDescription('Your detailed feedback - be specific and constructive!')
                .setRequired(true)
                .setMaxLength(1000)
        )
        .addIntegerOption((option) =>
            option
                .setName('rating')
                .setDescription('Rate your experience (1-5 stars)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)
        )
        .addStringOption((option) =>
            option
                .setName('category')
                .setDescription('What type of feedback is this?')
                .setRequired(false)
                .addChoices(
                    { name: 'Bug Report', value: 'bug' },
                    { name: 'Feature Request', value: 'feature' },
                    { name: 'General Feedback', value: 'general' },
                    { name: 'Complaint', value: 'complaint' },
                    { name: 'Compliment', value: 'compliment' }
                )
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const profanity = new Profanity();
        const feedbackChannel = client.channels.cache.get('1471348003297300662') as
            | TextChannel
            | undefined;
        const feedback = interaction.options.getString('feedback', true);
        const rating = interaction.options.getInteger('rating', true);
        const category = interaction.options.getString('category') || 'general';

        if (!feedbackChannel) {
            return interaction.reply({
                content: '❌ Feedback system is currently unavailable. Please try again later.',
                ephemeral: true,
            });
        }

        if (profanity.exists(feedback)) {
            return interaction.reply({
                content:
                    '❌ Please keep your feedback respectful and constructive. Profanity is not allowed.',
                ephemeral: true,
            });
        }

        const maskedFeedback = profanity.censor(feedback);

        const userEmbed = new EmbedBuilder()
            .setTitle('✅ Feedback Received!')
            .setDescription('Thank you for your valuable feedback! We appreciate your input.')
            .addFields(
                { name: 'Your Feedback', value: maskedFeedback, inline: false },
                {
                    name: 'Rating',
                    value: '⭐'.repeat(rating) + '☆'.repeat(5 - rating),
                    inline: true,
                },
                {
                    name: 'Category',
                    value: category.charAt(0).toUpperCase() + category.slice(1),
                    inline: true,
                }
            )
            .setColor(rating >= 4 ? '#00ff00' : rating >= 3 ? '#ffff00' : '#ff6600')
            .setFooter({ text: 'Feedback ID: ' + Date.now() })
            .setTimestamp();

        const adminEmbed = new EmbedBuilder()
            .setTitle('📝 New Feedback Received')
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL({ size: 64 }),
            })
            .addFields(
                { name: 'User ID', value: interaction.user.id, inline: true },
                { name: 'Server', value: interaction.guild?.name || 'DM', inline: true },
                { name: 'Rating', value: `${rating}/5 ⭐`, inline: true },
                {
                    name: 'Category',
                    value: category.charAt(0).toUpperCase() + category.slice(1),
                    inline: true,
                },
                { name: 'Feedback', value: maskedFeedback, inline: false }
            )
            .setColor(rating >= 4 ? '#00ff00' : rating >= 3 ? '#ffff00' : '#ff6600')
            .setFooter({ text: `Feedback ID: ${Date.now()}` })
            .setTimestamp();

        if (interaction.guild) {
            adminEmbed.addFields({
                name: 'Server ID',
                value: interaction.guild.id,
                inline: true,
            });
        }

        try {
            await feedbackChannel.send({ embeds: [adminEmbed] });
            return interaction.reply({ embeds: [userEmbed], ephemeral: true });
        } catch (error) {
            console.error('Failed to send feedback:', error);
            return interaction.reply({
                content: '❌ Failed to send feedback. Please try again later.',
                ephemeral: true,
            });
        }
    },
};
