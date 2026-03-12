import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
    User,
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
        .setName('view_previous')
        .setDescription("View a user's previous tickets.")
        .addUserOption((option) => option.setName('user').setDescription('User to view')),

    async execute(
        interaction: ChatInputCommandInteraction,
        client: Client,
        dbGuild: any,
        dbUser: any
    ) {
        if (!interaction.guild || !interaction.channel) return;
        if (!hasTicketStaff(interaction, dbGuild))
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'You need the ticket staff role to use this command.'
                    ),
                ],
            };

        let user: User | null = interaction.options.getUser('user');

        if (!user) {
            const ticket = await Tickets.findOne({
                guild: interaction.guild.id,
                channel: interaction.channel.id,
            });
            if (!ticket) return { embeds: [EmbedGenerator.errorEmbed('User not found.')] };
            user = await client.users.fetch(ticket.user).catch(() => null);
            if (!user) return { embeds: [EmbedGenerator.errorEmbed('User not found.')] };
        }

        const tickets = await Tickets.find({
            guild: interaction.guild.id,
            user: user.id,
            active: false,
        });
        if (tickets.length === 0)
            return { embeds: [EmbedGenerator.errorEmbed('No previous tickets found.')] };

        const embeds = [];
        for (let i = 0; i < tickets.length; i += 10) {
            const ticketsSlice = tickets.slice(i, i + 10);
            const baseUrl =
                process.env.LIVE === 'true' ? 'https://guardianbot.space' : 'http://localhost:3001';
            const embed = EmbedGenerator.basicEmbed(
                ticketsSlice
                    .map(
                        (ticket: any) =>
                            `[${ticket._id.toString()}](${baseUrl}/guilds/${ticket.guild}/tickets/${ticket._id.toString()})`
                    )
                    .join('\n')
            )
                .setTitle('Previous Tickets')
                .setTimestamp();
            embeds.push(embed);
        }

        await EmbedGenerator.pagesEmbed(interaction, embeds, false, dbUser?.language);
    },
};
