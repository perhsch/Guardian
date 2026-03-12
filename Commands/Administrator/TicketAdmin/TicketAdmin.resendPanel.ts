import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextChannel,
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('resend_panel')
        .setDescription('Resend the ticket creation panel (e.g. after setup via /setup).')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription(
                    'Channel to send the panel to (default: current ticket panel channel)'
                )
                .addChannelTypes(ChannelType.GuildText)
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        if (!dbGuild?.tickets?.enabled) {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'Ticket system is not enabled. Use /ticket_admin setup first.'
                    ),
                ],
                ephemeral: true,
            };
        }

        const channelOption = interaction.options.getChannel('channel') as TextChannel | null;
        const channel: TextChannel | null =
            channelOption ||
            (dbGuild.tickets.channel
                ? ((await interaction.guild.channels
                      .fetch(dbGuild.tickets.channel)
                      .catch(() => null)) as TextChannel | null)
                : null);

        if (!channel || channel.type !== ChannelType.GuildText) {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'No valid channel. Specify a channel or run /ticket_admin setup to set the ticket channel.'
                    ),
                ],
                ephemeral: true,
            };
        }

        try {
            await channel.send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        'Please press the button to create a ticket.'
                    ).setAuthor({
                        name: `Create a Ticket | ${client.user!.username}`,
                        iconURL: client.user!.displayAvatarURL(),
                    }),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('open-ticket')
                            .setEmoji('✉️')
                            .setLabel('Open Ticket')
                            .setStyle(ButtonStyle.Success)
                    ),
                ],
            });
        } catch {
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'Could not send the panel to that channel. Check bot permissions.'
                    ),
                ],
                ephemeral: true,
            };
        }

        return { embeds: [EmbedGenerator.basicEmbed(`Ticket panel sent to <#${channel.id}>.`)] };
    },
};
