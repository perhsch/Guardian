const Discord = require('discord.js');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('hack')
        .setDescription('Hack into the mainframe!')
        .addStringOption((option) =>
            option.setName('target').setDescription('The target to hack').setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('method').setDescription('The method of hacking').setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('level').setDescription('The level of hacking').setRequired(true)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const target = interaction.options.getString('target');
        const method = interaction.options.getString('method');
        const level = interaction.options.getString('level');
        
        await interaction.reply({
            content: `Initializing hack on **${target}**...\nUsing method: **${method}**\nSecurity breach level: **${level}**\nEstablishing connection...`,
            ephemeral: false,
        });

        // Dramatic simulated hack progress
        await new Promise(r => setTimeout(r, 1500));
        await interaction.followUp({ content: 'Bypassing firewalls...', ephemeral: false });
        await new Promise(r => setTimeout(r, 1200));
        await interaction.followUp({ content: 'Injecting payload...', ephemeral: false });
        await new Promise(r => setTimeout(r, 1200));
        await interaction.followUp({ content: `Accessing ${target} mainframe...`, ephemeral: false });
        await new Promise(r => setTimeout(r, 1300));
        await interaction.followUp({ content: 'Data extraction in progress... 💾', ephemeral: false });
        await new Promise(r => setTimeout(r, 1500));

        // Randomized hack outcome
        const outcomes = [
            `✅ Hack successful! All data from **${target}** obtained. 🟢`,
            `❌ Hack failed! Target **${target}** detected the intrusion and counteracted. 🔴`,
            `⚠️ Partial access achieved at level ${level} using ${method}. More info required! 🟡`
        ];
        // Random outcome
        const finalMessage = outcomes[Math.floor(Math.random() * outcomes.length)];
        await interaction.followUp({ content: finalMessage, ephemeral: false });
    },
};
