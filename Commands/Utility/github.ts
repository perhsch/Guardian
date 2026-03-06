import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('github')
        .setDescription('Check GitHub stats of a user.')
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription('The GitHub username to check')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const username = interaction.options.getString('username', true);
        await interaction.deferReply();

        try {
            const response = await axios.get(`https://api.github.com/users/${username}`);
            const data = response.data;

            const accountAge = new Date(data.created_at);
            const lastActive = data.updated_at ? new Date(data.updated_at) : null;
            const accountAgeDays = Math.floor((Date.now() - accountAge.getTime()) / (1000 * 60 * 60 * 24));

            const embed = new EmbedBuilder()
                .setTitle(`🐙 ${data.name || username}'s GitHub Profile`)
                .setURL(data.html_url)
                .setThumbnail(data.avatar_url)
                .setDescription(data.bio ? `**${data.bio}**` : '*No bio available*')
                .setColor(data.blog ? '#0969da' : '#24292f')
                .addFields(
                    {
                        name: '📊 Account Statistics',
                        value: [
                            `**${data.public_repos}** Public Repositories`,
                            `**${data.followers}** Followers`,
                            `**${data.following}** Following`,
                            `**${data.public_gists}** Public Gists`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚡ Activity',
                        value: [
                            `**${accountAgeDays}** days on GitHub`,
                            `**${data.public_repos > 0 ? Math.round(data.public_repos / (accountAgeDays / 30)) : 0}** repos/month avg`,
                            lastActive ? `Last active: <t:${Math.floor(lastActive.getTime() / 1000)}:R>` : 'No recent activity'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔗 Links',
                        value: [
                            `[🔗 Profile](${data.html_url})`,
                            data.blog ? `[🌐 Website](${data.blog})` : '🌐 No website',
                            data.twitter_username ? `[🐦 Twitter](https://twitter.com/${data.twitter_username})` : '🐦 No Twitter',
                            data.location ? `📍 ${data.location}` : '📍 No location'
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({
                    text: `GitHub User: ${data.login} • ID: ${data.id}`,
                    iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
                })
                .setTimestamp();

            if (data.company) embed.addFields({ name: '💼 Company', value: data.company, inline: false });
            if (data.email) embed.addFields({ name: '📧 Email', value: `||${data.email}||`, inline: false });

            await interaction.editReply({ embeds: [embed] });
        } catch (error: any) {
            if (error.response?.status === 404) {
                await interaction.editReply({ embeds: [EmbedGenerator.errorEmbed(`GitHub user **${username}** not found.`)] });
            } else if (error.response?.status === 403) {
                await interaction.editReply({ embeds: [EmbedGenerator.errorEmbed('GitHub API rate limit exceeded. Please try again later.')] });
            } else {
                await interaction.editReply({ embeds: [EmbedGenerator.errorEmbed('Failed to fetch GitHub data. Please try again later.')] });
            }
        }
    },
};
