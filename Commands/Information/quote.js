const { SlashCommandBuilder } = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Get an inspirational quote')
        .addStringOption((option) =>
            option.setName('category')
                .setDescription('Choose a quote category')
                .addChoices(
                    { name: '🌟 Inspirational', value: 'inspirational' },
                    { name: '💪 Motivational', value: 'motivational' },
                    { name: '🧠 Wisdom', value: 'wisdom' },
                    { name: '😊 Happiness', value: 'happiness' },
                    { name: '📚 Success', value: 'success' },
                    { name: '🎯 Random', value: 'random' }
                )
                .setRequired(false)
        ),
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const category = interaction.options.getString('category') || 'random';

        const quotes = {
            inspirational: [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
                { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
                { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
                { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
                { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
                { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                { text: "The only impossible thing is that which you don't attempt.", author: "Unknown" }
            ],
            motivational: [
                { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
                { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
                { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
                { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
                { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
                { text: "Dream bigger. Do bigger.", author: "Unknown" },
                { text: "Don't stop when you're tired. Stop when you're done.", author: "Wesley Snipes" },
                { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" }
            ],
            wisdom: [
                { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
                { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
                { text: "The unexamined life is not worth living.", author: "Socrates" },
                { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
                { text: "The only wisdom we can hope to acquire is the wisdom of humility.", author: "T.S. Eliot" },
                { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
                { text: "The wise man is one who, knows, what he does not know.", author: "Lao Tzu" },
                { text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" }
            ],
            happiness: [
                { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
                { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
                { text: "Happiness depends upon ourselves.", author: "Aristotle" },
                { text: "The best way to cheer yourself is to try to cheer someone else up.", author: "Mark Twain" },
                { text: "Happiness is a warm puppy.", author: "Charles M. Schulz" },
                { text: "The foolish man seeks happiness in the distance; the wise grows it under his feet.", author: "James Oppenheim" },
                { text: "Joy is the simplest form of gratitude.", author: "Karl Barth" },
                { text: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi" }
            ],
            success: [
                { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
                { text: "The road to success and the road to failure are almost exactly the same.", author: "Colin R. Davis" },
                { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
                { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
                { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
                { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas A. Edison" },
                { text: "A successful man is one who can lay a firm foundation with the bricks others have thrown at him.", author: "David Brinkley" },
                { text: "The secret of success is to do the common thing uncommonly well.", author: "John D. Rockefeller Jr." }
            ],
            random: []
        };

        quotes.random = [
            ...quotes.inspirational,
            ...quotes.motivational,
            ...quotes.wisdom,
            ...quotes.happiness,
            ...quotes.success
        ];

        const categoryQuotes = quotes[category];
        const randomQuote = categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];

        const categoryInfo = {
            inspirational: { emoji: '🌟', color: '#FFD700' },
            motivational: { emoji: '💪', color: '#FF6B6B' },
            wisdom: { emoji: '🧠', color: '#9B59B6' },
            happiness: { emoji: '😊', color: '#FFB6C1' },
            success: { emoji: '📚', color: '#4ECDC4' },
            random: { emoji: '🎯', color: '#3498DB' }
        };

        const info = categoryInfo[category];

        const embed = new EmbedGenerator.basicEmbed()
            .setTitle(`${info.emoji} Daily Quote`)
            .setDescription(
                `> **"${randomQuote.text}"**\n\n` +
                `*— ${randomQuote.author}*`
            )
            .setColor(info.color)
            .addFields(
                {
                    name: '📋 Category',
                    value: `${info.emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                    inline: true
                },
                {
                    name: '🎲 Quote ID',
                    value: `\`Q-${Date.now().toString(36).toUpperCase()}\``,
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/1234567890/1234567890/quote-icon.png')
            .setFooter({
                text: `Requested by ${interaction.user.tag} • Share the inspiration!`,
                iconURL: interaction.user.displayAvatarURL({ size: 256 })
            })
            .setTimestamp();

        return { embeds: [embed] };
    },
};
