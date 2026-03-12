import Discord from 'discord.js';
// @ts-ignore
import Captcha from 'captcha-generator-alphanumeric';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import { GuildsManager } from '../../Classes/GuildsManager.ts';
import { UsersManager } from '../../Classes/UsersManager.ts';

export default {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     */
    async execute(interaction: Discord.Interaction) {
        if (!interaction.guild) return;

        // Handle verification button click
        if (interaction.isButton() && interaction.customId === 'verification') {
            const guild = await GuildsManager.fetch(interaction.guild.id);
            if (!guild.verification.enabled)
                return interaction.reply({
                    embeds: [
                        EmbedGenerator.errorEmbed(
                            "This guild doesn't have the Verification system enabled."
                        ),
                    ],
                    ephemeral: true,
                });

            const member = interaction.member as Discord.GuildMember;
            if (
                !guild.verification.unverifiedRole ||
                !member.roles.cache.has(guild.verification.unverifiedRole)
            )
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('You are already verified.')],
                    ephemeral: true,
                });

            // Handle button version
            if (guild.verification.version === 'button') {
                try {
                    await member.roles.remove(
                        guild.verification.unverifiedRole,
                        'Verification completed'
                    );
                    if (guild.verification.role) {
                        await member.roles
                            .add(guild.verification.role, 'Verification completed')
                            .catch(() => null);
                    }

                    return interaction.reply({
                        embeds: [EmbedGenerator.basicEmbed('Verification completed.')],
                        ephemeral: true,
                    });
                } catch (err) {
                    return interaction.reply({
                        embeds: [EmbedGenerator.errorEmbed()],
                        ephemeral: true,
                    });
                }
            }

            // Handle captcha version
            if (guild.verification.version === 'captcha') {
                const dbUser = await UsersManager.fetch(interaction.user.id, interaction.guild.id);
                // @ts-ignore
                const generatedCaptcha = new Captcha.default();
                dbUser.captcha = generatedCaptcha.value;

                return interaction.reply({
                    embeds: [
                        EmbedGenerator.basicEmbed(
                            'Please enter the captcha shown below to complete verification.'
                        )
                            .setTitle(`Captcha Verification | ${interaction.guild.name}`)
                            .setImage('attachment://captcha.jpg')
                            .setFooter({
                                text: 'Click the button below to enter the captcha.',
                            }),
                    ],
                    files: [
                        new Discord.AttachmentBuilder(generatedCaptcha.JPEGStream, {
                            name: 'captcha.jpg',
                        }),
                    ],
                    components: [
                        new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents([
                            new Discord.ButtonBuilder()
                                .setCustomId('verification_captcha_input')
                                .setLabel('Enter Captcha')
                                .setStyle(Discord.ButtonStyle.Primary),
                        ]),
                    ],
                    ephemeral: true,
                });
            }

            return interaction.reply({
                embeds: [EmbedGenerator.errorEmbed('This guild uses a command for verification.')],
                ephemeral: true,
            });
        }

        // Handle captcha input button click
        if (interaction.isButton() && interaction.customId === 'verification_captcha_input') {
            const guild = await GuildsManager.fetch(interaction.guild.id);
            if (!guild.verification.enabled || guild.verification.version !== 'captcha')
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Verification is not available.')],
                    ephemeral: true,
                });

            const modal = new Discord.ModalBuilder()
                .setCustomId('verification_captcha_modal')
                .setTitle('Enter Captcha');

            const captchaInput = new Discord.TextInputBuilder()
                .setCustomId('captcha_input')
                .setLabel('Captcha Code')
                .setStyle(Discord.TextInputStyle.Short)
                .setPlaceholder('Enter the 6-character captcha')
                .setMinLength(6)
                .setMaxLength(6)
                .setRequired(true);

            const actionRow =
                new Discord.ActionRowBuilder<Discord.TextInputBuilder>().addComponents(
                    captchaInput
                );
            modal.addComponents(actionRow);

            return interaction.showModal(modal);
        }

        // Handle captcha modal submission
        if (interaction.isModalSubmit() && interaction.customId === 'verification_captcha_modal') {
            const guild = await GuildsManager.fetch(interaction.guild.id);
            if (!guild.verification.enabled || guild.verification.version !== 'captcha')
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Verification is not available.')],
                    ephemeral: true,
                });

            const member = interaction.member as Discord.GuildMember;
            if (
                !guild.verification.unverifiedRole ||
                !member.roles.cache.has(guild.verification.unverifiedRole)
            )
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('You are already verified.')],
                    ephemeral: true,
                });

            const dbUser = await UsersManager.fetch(interaction.user.id, interaction.guild.id);
            const captchaInput = interaction.fields.getTextInputValue('captcha_input');

            if (!dbUser.captcha) {
                return interaction.reply({
                    embeds: [
                        EmbedGenerator.errorEmbed(
                            'No captcha found. Please click the verify button again.'
                        ),
                    ],
                    ephemeral: true,
                });
            }

            if (captchaInput.toUpperCase() === dbUser.captcha) {
                try {
                    await member.roles.remove(
                        guild.verification.unverifiedRole,
                        'Verification completed'
                    );
                    if (guild.verification.role) {
                        await member.roles
                            .add(guild.verification.role, 'Verification completed')
                            .catch(() => null);
                    }

                    dbUser.captcha = null; // Clear captcha after successful verification

                    return interaction.reply({
                        embeds: [EmbedGenerator.basicEmbed('Verification completed.')],
                        ephemeral: true,
                    });
                } catch (err) {
                    return interaction.reply({
                        embeds: [EmbedGenerator.errorEmbed()],
                        ephemeral: true,
                    });
                }
            } else {
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('The captcha you provided is incorrect.')],
                    ephemeral: true,
                });
            }
        }
    },
};
