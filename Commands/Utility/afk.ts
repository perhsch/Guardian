import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import AFK from '../../Schemas/AFK.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set yourself as AFK')
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for being AFK').setMaxLength(100).setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const user = interaction.user;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const existingAFK = await AFK.findOne({ user: user.id, guild: interaction.guild.id })
        if (existingAFK) {
            await AFK.deleteOne({ user: user.id, guild: interaction.guild.id });
            return interaction.reply('You have been removed from the AFK list.');
        }

        await AFK.create({ user: user.id, guild: interaction.guild.id, reason, since: Date.now() });
        return interaction.reply(`You have been set as AFK. Reason: ${reason}`);
    },
};
