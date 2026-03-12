import Discord from 'discord.js';
import { GuildsManager } from '../../Classes/GuildsManager.ts';
import {
    getSuggestionPercentageString,
    isSuggestionMessage,
} from '../../Functions/suggestionReactions.ts';
import ReactionRoles from '../../Schemas/ReactionRoles.ts';

export default {
    name: 'messageReactionRemove',
    /**
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     * @param {Discord.Client} client
     */
    async execute(
        reaction: Discord.MessageReaction | Discord.PartialMessageReaction,
        user: Discord.User | Discord.PartialUser,
        client: Discord.Client
    ) {
        if (user.bot) return;

        const message = reaction.message.partial
            ? await reaction.message.fetch()
            : reaction.message;
        if (!message.guild) return;

        const reactionRole = await ReactionRoles.findOne({
            guild: message.guild.id,
            message: message.id,
        });

        if (reactionRole) {
            const member = await message.guild.members
                .fetch({ user: user as Discord.User })
                .catch(() => null);
            if (!member) return;

            const emojiName = reaction.emoji.name;
            if (emojiName) {
                const index = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'].indexOf(
                    emojiName
                );
                if (index !== -1 && reactionRole.roles[index]) {
                    const role = await message.guild.roles
                        .fetch(reactionRole.roles[index])
                        .catch(() => null);
                    if (role && role instanceof Discord.Role) {
                        await member.roles.remove(role).catch(() => null);
                    }
                }
            }
        }

        await updateSuggestionEmbedReactions(reaction as Discord.MessageReaction, client);
    },
};

async function updateSuggestionEmbedReactions(
    reaction: Discord.MessageReaction,
    client: Discord.Client
) {
    try {
        const msg = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
        if (!msg.guild) return;
        const dbGuild = await GuildsManager.fetch(msg.guild.id);
        if (!isSuggestionMessage(msg as Discord.Message, dbGuild)) return;
        const footerText = await getSuggestionPercentageString(msg as Discord.Message);
        const oldEmbed = msg.embeds[0];
        if (!oldEmbed?.data) return;
        const newEmbed = new Discord.EmbedBuilder(oldEmbed.data).setFooter({ text: footerText });
        await msg.edit({ embeds: [newEmbed] });
    } catch {
        // ignore
    }
}
