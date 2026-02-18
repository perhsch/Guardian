const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { GuildsManager } = require('../../Classes/GuildsManager');

const Infractions = require('../../Schemas/Infractions');
const Tickets = require('../../Schemas/Tickets');

/** Sanitize channel name for Discord (alphanumeric, hyphen, underscore; max 100 chars) */
function sanitizeTicketChannelName(name) {
    const sanitized = name.replace(/[^a-zA-Z0-9\-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return (sanitized || 'ticket').slice(0, 100);
}

module.exports = {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     */
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const customId = interaction.customId;
        if (customId === 'open-ticket') return handleOpenTicket(interaction);
        if (customId === 'close-ticket') return handleCloseTicketButton(interaction);
    },
};

async function handleOpenTicket(interaction) {
    const guild = await GuildsManager.fetch(interaction.guild.id);
    if (!guild.tickets.enabled)
        return interaction.reply({
            embeds: [
                EmbedGenerator.basicEmbed("This guild doesn't have the ticket system enabled."),
            ],
            ephemeral: true,
        });

    const blocked = await Infractions.findOne({
        guild: interaction.guild.id,
        user: interaction.user.id,
        type: 'block',
        active: true,
    });
    if (blocked)
        return interaction.reply({
            embeds: [EmbedGenerator.errorEmbed('You are blocked from creating tickets.')],
            ephemeral: true,
        });

    const existingTicket = await Tickets.findOne({
        guild: interaction.guild.id,
        user: interaction.user.id,
        active: true,
    });
    if (existingTicket)
        return interaction.reply({
            embeds: [EmbedGenerator.errorEmbed('You already have an open ticket.')],
            ephemeral: true,
        });

    const channelName = `ticket-${sanitizeTicketChannelName(interaction.user.username)}`;

    try {
        const channel = await interaction.guild.channels.create({
            name: channelName,
            parent: guild.tickets.category,
            type: Discord.ChannelType.GuildText,
        });

        await channel.lockPermissions().catch(() => null);
        await channel.permissionOverwrites
            .edit(interaction.user.id, { ViewChannel: true, SendMessages: true })
            .catch(() => null);
        if (guild.tickets.role) {
            await channel.permissionOverwrites
                .edit(guild.tickets.role, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true })
                .catch(() => null);
        }

        const previousTickets = await Tickets.find({
            guild: interaction.guild.id,
            user: interaction.user.id,
        }).sort({ _id: -1 });

        await Tickets.create({
            guild: interaction.guild.id,
            user: interaction.user.id,
            channel: channel.id,
        });

        const baseUrl =
            process.env.LIVE === 'true' ? 'https://guardianbot.space' : 'http://localhost:3001';
        const previousLinks =
            previousTickets.length === 0
                ? 'No previous tickets.'
                : previousTickets
                      .slice(0, 5)
                      .map(
                          (t) =>
                              `[${t._id.toString()}](${baseUrl}/guilds/${t.guild}/tickets/${t._id.toString()})`
                      )
                      .join('\n');

        await channel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [
                EmbedGenerator.basicEmbed()
                    .addFields({
                        name: `Previous Tickets (${previousTickets.slice(0, 5).length}/${previousTickets.length})`,
                        value: previousLinks,
                    })
                    .setAuthor({
                        name: `Ticket | ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    })
                    .setTimestamp()
                    .setFooter({ text: 'Use the button below to close this ticket, or ask staff to close it.' }),
            ],
            components: [
                new Discord.ActionRowBuilder().addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('close-ticket')
                        .setEmoji('🔒')
                        .setLabel('Close Ticket')
                        .setStyle(Discord.ButtonStyle.Danger)
                ),
            ],
        });

        await interaction.reply({
            embeds: [EmbedGenerator.basicEmbed(`Ticket created, <#${channel.id}>`)],
            ephemeral: true,
        });
    } catch (err) {
        await interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true }).catch(() => null);
    }
}

async function handleCloseTicketButton(interaction) {
    const guild = await GuildsManager.fetch(interaction.guild.id);
    if (!guild.tickets.enabled) return;

    const ticket = await Tickets.findOne({
        guild: interaction.guild.id,
        channel: interaction.channel.id,
        active: true,
    });
    if (!ticket)
        return interaction.reply({
            embeds: [EmbedGenerator.errorEmbed('This is not an active ticket channel.')],
            ephemeral: true,
        });

    const isStaff =
        guild.tickets.role &&
        interaction.member.roles.cache.has(guild.tickets.role);
    const isCreator = ticket.user === interaction.user.id;
    if (!isStaff && !isCreator)
        return interaction.reply({
            embeds: [EmbedGenerator.errorEmbed('Only ticket staff or the ticket creator can close this ticket.')],
            ephemeral: true,
        });

    await interaction.reply({
        embeds: [EmbedGenerator.basicEmbed('Closing this ticket…')],
        ephemeral: true,
    });

    const { closeTicketChannel } = require('../../Functions/ticketClose');
    await closeTicketChannel(
        interaction.client,
        interaction.guild,
        interaction.channel,
        ticket,
        interaction.user.id,
        guild.tickets.logChannel
    );
}
