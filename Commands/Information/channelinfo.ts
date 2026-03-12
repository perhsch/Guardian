import {
    ChannelType,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    time,
    GuildChannel,
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('Receive information about the current channel'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !interaction.channel) return;

        const channel = interaction.channel as GuildChannel;

        const replyEmbed = EmbedGenerator.basicEmbed()
            .setColor(0x5865f2)
            .setAuthor({
                name: `${'name' in channel ? channel.name : 'Unknown'}`,
                iconURL: interaction.guild.iconURL() ?? undefined,
            })
            .addFields(
                { name: 'Name', value: 'name' in channel ? channel.name : 'Unknown', inline: true },
                { name: 'Type', value: `${ChannelType[channel.type]}`, inline: true },
                { name: 'ID', value: `${channel.id}`, inline: true },
                {
                    name: 'Created at',
                    value: `${time(Math.round((channel.createdTimestamp ?? Date.now()) / 1000), 'D')}`,
                    inline: true,
                },
                {
                    name: 'Position',
                    value: `${'position' in channel ? channel.position : 'N/A'}`,
                    inline: true,
                }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [replyEmbed] });
    },
};
