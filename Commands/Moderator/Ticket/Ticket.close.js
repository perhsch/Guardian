const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { closeTicketChannel } = require('../../../Functions/ticketClose');

const Tickets = require('../../../Schemas/Tickets');

function hasTicketStaff(interaction, dbGuild) {
    if (!dbGuild?.tickets?.role) return true;
    return interaction.member?.roles?.cache?.has(dbGuild.tickets.role);
}

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('close')
        .setDescription('Close the ticket.')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Ticket to close')
                .addChannelTypes(Discord.ChannelType.GuildText)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        /** @type {Discord.TextChannel} */ const channel =
            interaction.options.getChannel('channel') || interaction.channel;
        const ticket = await Tickets.findOne({ guild: interaction.guild.id, channel: channel.id });

        if (!ticket) return EmbedGenerator.errorEmbed('Ticket not found.');
        if (!ticket.active) return EmbedGenerator.errorEmbed('That ticket is not active.');

        const isInTicketChannel = interaction.channel.id === channel.id;
        const isCreator = ticket.user === interaction.user.id;
        if (!isInTicketChannel && !hasTicketStaff(interaction, dbGuild))
            return EmbedGenerator.errorEmbed('You need the ticket staff role to close tickets from another channel.');
        if (isInTicketChannel && !isCreator && !hasTicketStaff(interaction, dbGuild))
            return EmbedGenerator.errorEmbed('Only ticket staff or the ticket creator can close this ticket.');

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
