const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');

const Tickets = require('../../../Schemas/Tickets');
const Infractions = require('../../../Schemas/Infractions');

function hasTicketStaff(interaction, dbGuild) {
    if (!dbGuild?.tickets?.role) return true;
    return interaction.member?.roles?.cache?.has(dbGuild.tickets.role);
}

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('block')
        .setDescription('Block a user from creating tickets.')
        .addUserOption((option) => option.setName('user').setDescription('User to block'))
        .addStringOption((option) => option.setName('reason').setDescription('Reason for block')),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (!hasTicketStaff(interaction, dbGuild))
            return EmbedGenerator.errorEmbed('You need the ticket staff role to use this command.');
        /** @type {Discord.TextChannel} */ let user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Unspecified reason.';

        if (!user) {
            const ticket = await Tickets.findOne({
                guild: interaction.guild.id,
                channel: interaction.channel.id,
            });
            if (!ticket) return EmbedGenerator.errorEmbed('User not found.');

            user = await client.users.fetch(ticket.user).catch(() => null);
            if (!user) return EmbedGenerator.errorEmbed('User not found.');
        }

        const blocked = await Infractions.findOne({
            guild: interaction.guild.id,
            user: user.id,
            type: 'block',
            active: true,
        });
        if (blocked)
            return EmbedGenerator.errorEmbed('That user is already blocked from creating tickets.');

        await Infractions.create({
            guild: interaction.guild.id,
            user: user.id,
            issuer: interaction.user.id,
            type: 'block',
            reason: reason,
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

        return infractionEmbed;
    },
};
