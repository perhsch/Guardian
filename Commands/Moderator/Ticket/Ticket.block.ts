import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
    User,
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Tickets from '../../../Schemas/Tickets.ts';
import Infractions from '../../../Schemas/Infractions.ts';

function hasTicketStaff(interaction: ChatInputCommandInteraction, dbGuild: any): boolean {
    if (!dbGuild?.tickets?.role) return true;
    return (interaction.member as GuildMember)?.roles?.cache?.has(dbGuild.tickets.role) ?? false;
}

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('block')
        .setDescription('Block a user from creating tickets.')
        .addUserOption((option) => option.setName('user').setDescription('User to block'))
        .addStringOption((option) => option.setName('reason').setDescription('Reason for block')),

    async execute(interaction: ChatInputCommandInteraction, client: Client, dbGuild: any) {
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
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        if (!user) {
            const ticket = await Tickets.findOne({
                guild: interaction.guild.id,
                channel: interaction.channel.id,
            });
            if (!ticket) return { embeds: [EmbedGenerator.errorEmbed('User not found.')] };
            user = await client.users.fetch(ticket.user).catch(() => null);
            if (!user) return { embeds: [EmbedGenerator.errorEmbed('User not found.')] };
        }

        const blocked = await Infractions.findOne({
            guild: interaction.guild.id,
            user: user.id,
            type: 'block',
            active: true,
        });
        if (blocked)
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'That user is already blocked from creating tickets.'
                    ),
                ],
            };

        await Infractions.create({
            guild: interaction.guild.id,
            user: user.id,
            issuer: interaction.user.id,
            type: 'block',
            reason,
        });

        const infractionEmbed = EmbedGenerator.infractionEmbed(
            interaction.guild,
            interaction.user.id,
            'Block',
            null,
            null,
            reason
        );
        await user.send({ embeds: [infractionEmbed] }).catch(() => null);

        return { embeds: [infractionEmbed] };
    },
};
