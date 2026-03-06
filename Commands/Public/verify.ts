import { SlashCommandBuilder, ChatInputCommandInteraction, Client, GuildMember } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
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

    execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.member) return;

        if (!dbGuild.verification.enabled) {
            return {
                embeds: [EmbedGenerator.errorEmbed("This guild doesn't have the Verification system enabled.")],
                ephemeral: true,
            };
        }

        const member = interaction.member as GuildMember;

        if (!dbGuild.verification.unverifiedRole || !member.roles.cache.has(dbGuild.verification.unverifiedRole)) {
            return {
                embeds: [EmbedGenerator.errorEmbed('You are already verified.')],
                ephemeral: true,
            };
        }

        if (dbGuild.verification.version === 'button') {
            return {
                embeds: [EmbedGenerator.errorEmbed('This guild uses a button for verification.')],
                ephemeral: true,
            };
        }

        if (dbGuild.verification.version === 'captcha') {
            return {
                embeds: [EmbedGenerator.errorEmbed('This guild uses a button for captcha verification. Please use the verify button in the verification channel.')],
                ephemeral: true,
            };
        }

        if (dbGuild.verification.version === 'command') {
            member.roles
                .remove(dbGuild.verification.unverifiedRole, 'Verification completed')
                .then(() => {
                    if (dbGuild.verification.role) {
                        member.roles.add(dbGuild.verification.role, 'Verification completed').catch(() => null);
                    }
                    interaction.reply({
                        embeds: [EmbedGenerator.basicEmbed('Verification completed.')],
                        ephemeral: true,
                    });
                })
                .catch(() => {
                    interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true });
                });
        }
    },
};
