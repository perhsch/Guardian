const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { GuildsManager } = require('../../Classes/GuildsManager');

const Infractions = require('../../Schemas/Infractions');
const Tickets = require('../../Schemas/Tickets');

// Import ticket options from the main ticket file
const ticketButton = require('./ticketButton.js');
const ticketMenuData = ticketButton.ticketMenuData;
const TICKET_OPTIONS = ticketButton.TICKET_OPTIONS;
const createTicketWithType = ticketButton.createTicketWithType;

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (user.bot) return;

        const message = reaction.message;
        const emoji = reaction.emoji.toString();

        // Check if this is a ticket menu message
        const menuData = ticketMenuData.get(message.id);
        if (!menuData) return;

        // Check if emoji is a valid ticket option
        if (!TICKET_OPTIONS[emoji]) return;

        // Remove the user's reaction
        await reaction.users.remove(user).catch(() => null);

        // Create ticket with selected type
        await createTicketWithType(
            user,
            menuData.guild,
            menuData.channel,
            emoji,
            menuData.category,
            menuData.role,
            menuData.ticketId
        );
    },
};
