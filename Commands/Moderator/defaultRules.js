const Discord = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Posts default server rules to the current channel..')
        .setDMPermission(false),

    async execute(interaction, client, dbGuild) {
        const guild = interaction.guild;

        const rulesEmbed = new Discord.EmbedBuilder()
            .setColor(0x5865f2)
            .setAuthor({
                name: `${guild.name} — Server Rules`,
                iconURL: guild.iconURL({ size: 64 }),
            })
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setDescription(
                [
                    '**Welcome.** By participating here you agree to follow these rules.',
                    'Breaking them may result in warnings, timeouts, or a ban.',
                    '',
                    '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
                ].join('\n')
            )
            .addFields(
                {
                    name: '🤝 Respect & conduct',
                    value: [
                        '**1.** Be respectful to everyone. No harassment, bullying, or personal attacks.',
                        '**2.** No hate speech, slurs, or discriminatory remarks.',
                        '**3.** No excessive swearing or deliberately offensive language.',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '💬 Chat & behavior',
                    value: [
                        '**4.** No spamming, flooding, or repetitive messages.',
                        '**5.** No advertising, self-promotion, or unsolicited DMs without permission.',
                        '**6.** Use the correct channels and follow staff directions.',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '🛡️ Safety & content',
                    value: [
                        '**7.** No NSFW or adult content.',
                        '**8.** No sharing of personal information (doxxing) — yours or others.',
                        '**9.** No pirated, illegal, or malicious content (links, files, etc.).',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '⚖️ Integrity',
                    value: [
                        '**10.** No hacking, exploiting, cheating, or impersonation.',
                        "**11.** Follow Discord's [Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines).",
                    ].join('\n'),
                    inline: false,
                }
            )
            .setFooter({
                text: `Rules • ${guild.name}`,
                iconURL: guild.iconURL({ size: 32 }),
            })
            .setTimestamp();

        await interaction.reply({
            content: 'Rules posted.',
            ephemeral: true,
        });

        await interaction.channel.send({ embeds: [rulesEmbed] });
    },
};
