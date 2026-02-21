const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');

const Tickets = require('../../../Schemas/Tickets');

function hasTicketStaff(interaction, dbGuild) {
    if (!dbGuild?.tickets?.role) return true;
    return interaction.member?.roles?.cache?.has(dbGuild.tickets.role);
}

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('remove_user')
        .setDescription('Remove permission from a user to view a ticket.')
        .addUserOption((option) =>
            option.setName('user').setDescription('User to remove.').setRequired(true)
        )
        .addChannelOption((option) =>
            option.setName('channel').setDescription('Ticket to remove the user from.')
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (!hasTicketStaff(interaction, dbGuild))
            return EmbedGenerator.errorEmbed('You need the ticket staff role to use this command.');

        const user = await interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch({ user: user.id }).catch(() => null);
        /** @type {Discord.TextChannel} */ const channel =
            interaction.options.getChannel('channel') || interaction.channel;
        const ticket = await Tickets.findOne({ guild: interaction.guild.id, channel: channel.id });

        if (!ticket) return EmbedGenerator.errorEmbed('Ticket not found.');
        if (!ticket.active) return EmbedGenerator.errorEmbed('That ticket is not active.');
        if (ticket.user === user.id)
            return EmbedGenerator.errorEmbed('Unable to remove the ticket creator.');

        if (!member) return EmbedGenerator.errorEmbed('Member not found.');

        try {
            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: false,
                SendMessages: false,
            });
            return EmbedGenerator.basicEmbed('Member removed from ticket.');
        } catch {
            return EmbedGenerator.errorEmbed();
        }
    },
};
