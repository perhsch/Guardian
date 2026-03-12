import Discord from 'discord.js';
import { ticketMenuData, TICKET_OPTIONS, createTicketWithType } from './ticketButton.ts';

export default {
    name: 'messageReactionAdd',
    async execute(
        reaction: Discord.MessageReaction | Discord.PartialMessageReaction,
        user: Discord.User | Discord.PartialUser
    ) {
        if (user.bot) return;

        const message = reaction.message;
        const emoji = reaction.emoji.toString();

        // Check if this is a ticket menu message
        const menuData = ticketMenuData.get(message.id);
        if (!menuData) return;

        // Check if emoji is a valid ticket option
        if (!TICKET_OPTIONS[emoji]) return;

        // Remove the user's reaction
        await reaction.users.remove(user as Discord.User).catch(() => null);

        // Create ticket with selected type
        await createTicketWithType(
            user as Discord.User,
            menuData.guild,
            menuData.channel,
            emoji,
            menuData.category,
            menuData.role,
            menuData.ticketId
        );
    },
};
