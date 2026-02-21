const Discord = require(`discord.js`);

const AFK = require('../../Schemas/AFK');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set yourself as AFK')
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for being AFK').setRequired(false)
        ),
    async execute(interaction, client) {
        const user = interaction.user;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user is already AFK
        const existingAFK = await AFK.findOne({ user: user.id });
        if (existingAFK) {
            // Remove from AFK
            await AFK.deleteOne({ user: user.id });
            return await interaction.reply(`You have been removed from the AFK list.`);
        }

        // Add user to AFK
        await AFK.create({
            user: user.id,
            guild: interaction.guild.id,
            reason: reason,
        });

        await interaction.reply(`You have been set as AFK. Reason: ${reason}`);
    },
};
