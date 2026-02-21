const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('verify')
        .setDMPermission(false)
        .setDescription('Start/complete the verification used for the guild.')
        .addStringOption((option) =>
            option
                .setName('captcha')
                .setDescription('The captcha from the image you recieved')
                .setMinLength(6)
                .setMaxLength(6)
        ),
    /**
     *
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     * @param {import('../../Classes/UsersManager').UsersManager} dbUser
     */
    execute(interaction, client, dbGuild, dbUser) {
        if (!dbGuild.verification.enabled)
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'This guild doesn\'t have the Verification system enabled.'
                    ),
                ],
                ephemeral: true,
            };
        if (!dbGuild.verification.unverifiedRole || !interaction.member.roles.cache.has(dbGuild.verification.unverifiedRole))
            return {
                embeds: [EmbedGenerator.errorEmbed('You are already verified.')],
                ephemeral: true,
            };
        if (dbGuild.verification.version === 'button')
            return {
                embeds: [EmbedGenerator.errorEmbed('This guild uses a button for verification.')],
                ephemeral: true,
            };
        if (dbGuild.verification.version === 'captcha')
            return {
                embeds: [
                    EmbedGenerator.errorEmbed(
                        'This guild uses a button for captcha verification. Please use the verify button in the verification channel.'
                    ),
                ],
                ephemeral: true,
            };

        const captcha = interaction.options.getString('captcha');

        if (dbGuild.verification.version === 'command') {
            interaction.member.roles
                .remove(dbGuild.verification.unverifiedRole, 'Verification completed')
                .catch(() => {
                    interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
                })
                .then(() => {
                    if (dbGuild.verification.role) {
                        interaction.member.roles
                            .add(dbGuild.verification.role, 'Verification completed')
                            .catch(() => null);
                    }
                    interaction.reply({
                        embeds: [EmbedGenerator.basicEmbed('Verification completed.')],
                        ephemeral: true,
                    });
                });
        }
    },
};
