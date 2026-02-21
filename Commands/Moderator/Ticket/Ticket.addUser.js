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
        .setName('add_user')
        .setDescription('Give a user permission to view a ticket.')
        .addUserOption((option) =>
            option.setName('user').setDescription('User to add.').setRequired(true)
        )
        .addChannelOption((option) =>
            option.setName('channel').setDescription('Ticket to add the user to.')
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

        if (!member) return EmbedGenerator.errorEmbed('Member not found.');

        try {
            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            });
            return EmbedGenerator.basicEmbed('Member added to ticket.');
        } catch {
            return EmbedGenerator.errorEmbed();
        }
    },
};
