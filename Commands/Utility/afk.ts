import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
// @ts-ignore — AFK schema may not have types yet
import AFK from '../../Schemas/AFK.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set yourself as AFK')
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for being AFK').setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        if (!interaction.guild) return;

        const user = interaction.user;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const existingAFK = await AFK.findOne({ user: user.id });
        if (existingAFK) {
            await AFK.deleteOne({ user: user.id });
            return interaction.reply('You have been removed from the AFK list.');
        }

        await AFK.create({ user: user.id, guild: interaction.guild.id, reason });
        return interaction.reply(`You have been set as AFK. Reason: ${reason}`);
    },
};
