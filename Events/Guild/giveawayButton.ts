import Discord from 'discord.js';
import Moment from 'moment';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import Giveaways from '../../Schemas/Giveaways.ts';

export default {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     */
    async execute(interaction: Discord.Interaction) {
        if (!interaction.isButton() || interaction.customId !== 'giveaway') return;

        let giveaway = await Giveaways.findOne({ giveaway: interaction.message.id });
        if (!giveaway) {
            return interaction.reply({ 
                embeds: [EmbedGenerator.errorEmbed('Giveaway not found.')],
                ephemeral: true 
            });
        }
        
        if (!giveaway.active) {
            await (interaction.message as Discord.Message).edit({ components: [] });
            return interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('This giveaway is not active.')],
                ephemeral: true,
            });
        }

        const member = interaction.member as Discord.GuildMember;
        if (!giveaway.entries.includes(member.id)) {
            giveaway = await Giveaways.findOneAndUpdate(
                { giveaway: interaction.message.id },
                { $push: { entries: member.id } },
                { new: true }
            );

            if (!giveaway) return;

            const embedData = interaction.message.embeds[0].data;
            const embed = new Discord.EmbedBuilder(embedData);
            embed.setDescription(
                [
                    giveaway.description ? giveaway.description : null,
                    giveaway.description ? '' : null,
                    `Winners: **${giveaway.winners}**, Entries: **${giveaway.entries.length}**`,
                    `Status: Ongoing, ends in <t:${Moment(giveaway.expires).unix()}:R>(<t:${Moment(
                        giveaway.expires
                    ).unix()}:f>)`,
                ]
                    .filter((text) => text !== null)
                    .join('\n')
            );

            await interaction.update({ embeds: [embed] });
            await interaction.followUp({
                embeds: [EmbedGenerator.basicEmbed('You have entered the giveaway.')],
                ephemeral: true,
            });
        } else {
            return interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('You have already entered the giveaway!')],
                ephemeral: true,
            });
        }
    },
};
