import { SlashCommandBuilder, ChatInputCommandInteraction, Client, TextChannel } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDMPermission(false)
        .setDescription('Make a suggestion.')
        .addStringOption((option) =>
            option
                .setName('suggestion')
                .setDescription('Your suggestion.')
                .setMaxLength(4096)
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const suggestion = interaction.options.getString('suggestion', true);

        if (!dbGuild.suggestion.enabled) {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed('This guild has not enabled the Suggestion system.'),
                ],
                ephemeral: true,
            };
        }

        const channel = await interaction.guild.channels.fetch(dbGuild.suggestion.channel);
        if (!channel || !(channel instanceof TextChannel)) {
            return {
                embeds: [EmbedGenerator.errorEmbed('Unable to fetch suggestion channel.')],
                ephemeral: true,
            };
        }

        const embed = EmbedGenerator.basicEmbed(suggestion)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        if (dbGuild.suggestion.reactions) {
            embed.setFooter({ text: '✅ 0% | ❌ 0%' });
        }

        channel
            .send({ embeds: [embed] })
            .then(async (sent) => {
                if (dbGuild.suggestion.reactions) {
                    await sent.react('✅');
                    await sent.react('❌');
                }
                interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed('Suggested.')],
                    ephemeral: true,
                });
            })
            .catch(() => {
                interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
            });
    },
};
