const Discord = require('discord.js');
const moment = require('moment');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const Notes = require('../../../Schemas/Notes');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('view')
        .setDescription('View notes on a user.')
        .addStringOption((option) =>
            option
                .setName('user_id')
                .setDescription('The Discord user ID of the user to view notes for.')
                .setRequired(true)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     * @param {import('../../../Classes/UsersManager').UsersManager} dbUser
     */
    async execute(interaction, client, dbGuild, dbUser) {
        const userId = interaction.options.getString('user_id', true);

        const notes = await Notes.find({
            guild: interaction.guild.id,
            user: userId,
        }).sort({ time: -1 });

        if (notes.length === 0) {
            return { embeds: [EmbedGenerator.errorEmbed('No notes found for this user.')], ephemeral: true };
        }

        const embeds = [];

        for (let i = 0; i < notes.length; i += 8) {
            const notesSlice = notes.slice(i, i + 8);
            const embed = EmbedGenerator.basicEmbed()
                .setAuthor({
                    name: `Notes for ${userId}`,
                    iconURL: interaction.guild.iconURL(),
                })
                .setDescription(
                    [
                        `Total Notes: ${notes.length}`,
                        `Latest: <t:${moment(notes[0].time).unix()}:f>`,
                        '',
                        ...notesSlice.map(
                            (note) =>
                                `**\`${note.noteId}\`** • <@${note.author}> • <t:${moment(note.time).unix()}:R>\n${note.content}`
                        ),
                    ].join('\n\n')
                );

            embeds.push(embed);
        }

        await EmbedGenerator.pagesEmbed(interaction, embeds, true, dbUser?.language);
    },
};
