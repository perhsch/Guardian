import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDMPermission(false)
        .setDescription('Shows information about a user')
        .addUserOption((option) =>
            option.setName('user').setDescription('The user to get information about')
        ),

    execute(interaction: ChatInputCommandInteraction, _client: Client) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild?.members?.cache?.get(user.id);
        const userCreated = member?.joinedTimestamp || user.createdTimestamp;

        return {
            embeds: [
                EmbedGenerator.basicEmbed()
                    .addFields([
                        {
                            name: '👤 Username',
                            value: `${user.username}#${user.discriminator}`,
                            inline: true,
                        },
                        { name: '🆔 ID', value: user.id, inline: true },
                        {
                            name: '📆 Created',
                            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                            inline: true,
                        },
                        {
                            name: '📆 Joined',
                            value: `<t:${Math.floor(userCreated / 1000)}:R>`,
                            inline: true,
                        },
                        {
                            name: '📥 Avatar',
                            value: `[Click Here](${user.displayAvatarURL()})`,
                            inline: true,
                        },
                        { name: '🎮 Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                        {
                            name: '📷 Banner',
                            value: user.bannerURL() ? `[Click Here](${user.bannerURL()})` : 'None',
                            inline: true,
                        },
                        { name: '🎭 System', value: user.system ? 'Yes' : 'No', inline: true },
                    ])
                    .setThumbnail(user.displayAvatarURL()),
            ],
        };
    },
};
