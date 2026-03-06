import Discord, { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import moment from 'moment';
import ms from 'ms';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Infractions from '../../../Schemas/Infractions.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('view')
        .setDescription('View the logged bans of a user.')
        .addUserOption((option) =>
            option.setName('user').setDescription("The user you'd like to view.").setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, _dbGuild: any, dbUser: any) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);

        const bans = await Infractions.find({
            guild: interaction.guild.id,
            user: user.id,
            type: 'ban',
        }).sort({ time: -1 });

        if (bans.length === 0) {
            return interaction.reply({ embeds: [EmbedGenerator.errorEmbed('No bans found.')], ephemeral: true });
        }

        const embeds: EmbedBuilder[] = [];

        for (let i = 0; i < bans.length; i += 10) {
            const bansSlice = bans.slice(i, i + 10);
            const embed = EmbedGenerator.basicEmbed(
                [
                    `Total Bans: ${bans.length}`,
                    `Latest Ban: <t:${moment(bans[0]!.time).unix()}:f>`,
                    '',
                    ...bansSlice.map(
                        (ban, index) =>
                            `**${i + index + 1}** • ${
                                ban.permanent ? 'Permanent' : ms(ban.duration || 0, { long: true })
                            } • **${ban.reason}** • <@${ban.issuer}>`
                    ),
                ].join('\n')
            ).setAuthor({ name: `${user.tag} | Bans`, iconURL: user.displayAvatarURL() });

            embeds.push(embed);
        }

        await EmbedGenerator.pagesEmbed(interaction, embeds, false, dbUser?.language);
    },
};
