import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
    ChannelType,
    TextChannel,
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { closeTicketChannel } from '../../../Functions/ticketClose.ts';
import Tickets from '../../../Schemas/Tickets.ts';

function hasTicketStaff(interaction: ChatInputCommandInteraction, dbGuild: any): boolean {
    if (!dbGuild?.tickets?.role) return true;
    const member = interaction.member as GuildMember | null;
    return member?.roles?.cache?.has(dbGuild.tickets.role) ?? false;
}

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('close')
        .setDescription('Close the ticket.')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Ticket to close')
                .addChannelTypes(ChannelType.GuildText)
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.channel) return;

        const channel = (interaction.options.getChannel('channel') ||
            interaction.channel) as TextChannel;
        const ticket = await Tickets.findOne({ guild: interaction.guild.id, channel: channel.id });

        if (!ticket) return { embeds: [EmbedGenerator.errorEmbed('Ticket not found.')] };
        if (!ticket.active)
            return { embeds: [EmbedGenerator.errorEmbed('That ticket is not active.')] };

        const isInTicketChannel = interaction.channel.id === channel.id;
        const isCreator = ticket.user === interaction.user.id;
        if (!isInTicketChannel && !hasTicketStaff(interaction, dbGuild))
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'You need the ticket staff role to close tickets from another channel.'
                    ),
                ],
            };
        if (isInTicketChannel && !isCreator && !hasTicketStaff(interaction, dbGuild))
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'Only ticket staff or the ticket creator can close this ticket.'
                    ),
                ],
            };

        await interaction.deferReply();
        await closeTicketChannel(
            client,
            interaction.guild,
            channel,
            ticket,
            interaction.user.id,
            dbGuild?.tickets?.logChannel
        );
        await interaction.editReply({
            embeds: [EmbedGenerator.basicEmbed('This ticket has been closed.')],
        });
    },
};
