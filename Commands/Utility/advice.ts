import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const lifeAdvices = [
    'Take care of your mental health.',
    "Don't be afraid to ask for help.",
    'Stay hydrated.',
    'Get enough sleep.',
    'Take breaks when you need to.',
    "Don't compare yourself to others.",
    'Practice gratitude.',
    'Be kind to yourself.',
    'Stay true to your values.',
    'Learn from your mistakes.',
    'Take responsibility for your actions.',
    'Set boundaries.',
    "Don't be afraid to say no.",
    'Communicate openly and honestly.',
    'Spend time with loved ones.',
    'Find a hobby you enjoy.',
    'Take care of your physical health.',
    'Practice mindfulness.',
    'Challenge yourself to try new things.',
    'Believe in yourself.',
    'Celebrate your accomplishments.',
    "Learn to let go of things you can't control.",
    'Forgive yourself and others.',
    'Take time to reflect on your life.',
    'Be patient with yourself and others.',
    'Stay organized.',
    'Take time to relax and unwind.',
    "Don't be afraid to take risks.",
    'Stay positive.',
    'Remember that mistakes are opportunities to learn and grow.',
];

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('advice')
        .setDescription('Get a random life advice!')
        .setDMPermission(false),

    async execute(interaction: ChatInputCommandInteraction) {
        const advice = lifeAdvices[Math.floor(Math.random() * lifeAdvices.length)];

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('💡 Life Advice')
            .setDescription(advice!)
            .addFields({
                name: 'Remember',
                value: 'Take time to reflect on this advice and how it applies to your life.',
                inline: false,
            })
            .setFooter({
                text: 'Guardian Bot • Daily Wisdom',
                iconURL: interaction.client.user?.displayAvatarURL(),
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
