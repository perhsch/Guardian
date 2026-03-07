import { SlashCommandBuilder, ChatInputCommandInteraction, Client, TextChannel } from 'discord.js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('Send feedback to a certain channel.')
        .addStringOption((option) =>
            option.setName('feedback').setDescription('Your feedback.').setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName('rating').setDescription('Your rating out of 5.').setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const feedbackChannel = client.channels.cache.get('1471348003297300662') as TextChannel | undefined;
        const feedback = interaction.options.getString('feedback', true);
        const rating = interaction.options.getInteger('rating', true);

        if (feedbackChannel) {
            await feedbackChannel.send(
                `New Feedback from ${interaction.user.tag}: ${feedback}\nRating: ${rating}/5`
            );
        }

        return interaction.reply('Feedback sent!');
    },
};
