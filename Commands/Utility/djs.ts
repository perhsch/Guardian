import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('docs')
        .setDescription('Search the Discord.js documentation.')
        .addStringOption((option) =>
            option.setName('query').setDescription('The search query.').setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const query = interaction.options.getString('query', true);
        const searchUrl = `https://discord.js.org/#/docs/main/stable/search?q=${encodeURIComponent(query)}`;

        const embed = EmbedGenerator.basicEmbed()
            .setColor(0x5865f2)
            .setTitle('Discord.js Documentation Search')
            .addFields({ name: '🔍 Query', value: `\`\`\`${query}\`\`\``, inline: false })
            .setDescription(
                'Search results for your query are available in the Discord.js official documentation. Click the button below to view detailed information, code examples, and usage patterns.'
            )
            .setFooter({ text: 'Discord.js Documentation', iconURL: interaction.client.user!.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('📖 View Documentation')
                .setStyle(ButtonStyle.Link)
                .setURL(searchUrl)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
    },
};
