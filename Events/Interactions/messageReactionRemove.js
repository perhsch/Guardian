const Discord = require('discord.js');

const { GuildsManager } = require('../../Classes/GuildsManager');
const {
    getSuggestionPercentageString,
    isSuggestionMessage,
} = require('../../Functions/suggestionReactions');
const ReactionRoles = require('../../Schemas/ReactionRoles');

module.exports = {
    name: 'messageReactionRemove',
    /**
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     * @param {Discord.Client} client
     */
    async execute(reaction, user, client) {
        const reactionRole = await ReactionRoles.findOne({
            guild: reaction.message.guild?.id,
            message: reaction.message.id,
        });
        if (reactionRole) {
            const member = await reaction.message.guild.members
                .fetch({ user: user })
                .catch(() => null);
            if (!member) return;

            const role = await reaction.message.guild.roles
                .fetch(
                    reactionRole.roles[
                        ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'].indexOf(
                            reaction.emoji.name
                        )
                    ]
                )
                .catch(() => null);
            if (!role || !(role instanceof Discord.Role)) return;

            await member.roles.remove(role).catch(() => null);
        }

        await updateSuggestionEmbedReactions(reaction, client);
    },
};

async function updateSuggestionEmbedReactions(reaction, client) {
    try {
        const msg = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
        if (!msg.guild) return;
        const dbGuild = await GuildsManager.fetch(msg.guild.id);
        if (!isSuggestionMessage(msg, dbGuild)) return;
        const footerText = await getSuggestionPercentageString(msg);
        const oldEmbed = msg.embeds[0];
        if (!oldEmbed?.data) return;
        const newEmbed = new Discord.EmbedBuilder(oldEmbed.data).setFooter({ text: footerText });
        await msg.edit({ embeds: [newEmbed] });
    } catch {
        // ignore
    }
}
