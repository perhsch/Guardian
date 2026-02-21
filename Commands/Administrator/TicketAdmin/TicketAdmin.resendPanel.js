const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('resend_panel')
        .setDescription('Resend the ticket creation panel (e.g. after setup via /setup).')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Channel to send the panel to (default: current ticket panel channel)')
                .addChannelTypes(Discord.ChannelType.GuildText)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (!dbGuild?.tickets?.enabled)
            return EmbedGenerator.errorEmbed('Ticket system is not enabled. Use /ticket_admin setup first.');

        const channel =
            interaction.options.getChannel('channel') ||
            (dbGuild.tickets.channel
                ? await interaction.guild.channels.fetch(dbGuild.tickets.channel).catch(() => null)
                : null);

        if (!channel || channel.type !== Discord.ChannelType.GuildText)
            return EmbedGenerator.errorEmbed(
                'No valid channel. Specify a channel or run /ticket_admin setup to set the ticket channel.'
            );

        try {
            await channel.send({
                embeds: [
                    EmbedGenerator.basicEmbed('Please press the button to create a ticket.').setAuthor({
                        name: `Create a Ticket | ${client.user.username}`,
                        iconURL: client.user.displayAvatarURL(),
                    }),
                ],
                components: [
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('open-ticket')
                            .setEmoji('✉️')
                            .setLabel('Open Ticket')
                            .setStyle(Discord.ButtonStyle.Success)
                    ),
                ],
            });
        } catch {
            return EmbedGenerator.errorEmbed('Could not send the panel to that channel. Check bot permissions.');
        }

        return EmbedGenerator.basicEmbed(`Ticket panel sent to <#${channel.id}>.`);
    },
};
