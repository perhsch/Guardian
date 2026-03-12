import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
    TextChannel,
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Tickets from '../../../Schemas/Tickets.ts';

function hasTicketStaff(interaction: ChatInputCommandInteraction, dbGuild: any): boolean {
    if (!dbGuild?.tickets?.role) return true;
    return (interaction.member as GuildMember)?.roles?.cache?.has(dbGuild.tickets.role) ?? false;
}

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('remove_user')
        .setDescription('Remove permission from a user to view a ticket.')
        .addUserOption((option) =>
            option.setName('user').setDescription('User to remove.').setRequired(true)
        )
        .addChannelOption((option) =>
            option.setName('channel').setDescription('Ticket to remove the user from.')
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.channel) return;
        if (!hasTicketStaff(interaction, dbGuild))
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'You need the ticket staff role to use this command.'
                    ),
                ],
            };

        const user = interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch({ user: user.id }).catch(() => null);
        const channel = (interaction.options.getChannel('channel') ||
            interaction.channel) as TextChannel;
        const ticket = await Tickets.findOne({ guild: interaction.guild.id, channel: channel.id });

        if (!ticket) return { embeds: [EmbedGenerator.errorEmbed('Ticket not found.')] };
        if (!ticket.active)
            return { embeds: [EmbedGenerator.errorEmbed('That ticket is not active.')] };
        if (ticket.user === user.id)
            return { embeds: [EmbedGenerator.errorEmbed('Unable to remove the ticket creator.')] };
        if (!member) return { embeds: [EmbedGenerator.errorEmbed('Member not found.')] };

        try {
            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: false,
                SendMessages: false,
            });
            return { embeds: [EmbedGenerator.basicEmbed('Member removed from ticket.')] };
        } catch {
            return { embeds: [EmbedGenerator.errorEmbed()] };
        }
    },
};
