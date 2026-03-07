import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextChannel,
    Role
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

type VerificationType = 'button' | 'command' | 'captcha';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Configure the verification system.')
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('How to verify members.')
                .addChoices(
                    { name: 'Press a button', value: 'button' },
                    { name: 'Use a command', value: 'command' },
                    { name: 'Use a command with a captcha', value: 'captcha' }
                )
                .setRequired(true)
        )
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription('Role to give when verification is completed. (Will be created if unspecified)')
        )
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Channel used for unverified members. (Will be created if unspecified)')
                .addChannelTypes(ChannelType.GuildText)
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        const type = interaction.options.getString('type', true) as VerificationType;
        let verificationRole = interaction.options.getRole('role') as Role | null;
        let channel = interaction.options.getChannel('channel') as TextChannel | null;

        await interaction.deferReply();

        if (!verificationRole) {
            verificationRole = await interaction.guild.roles.create({
                name: 'Verified',
                color: '#000001',
                hoist: false,
                mentionable: false,
                permissions: [],
                position: 0,
            }).catch(() => null);

            if (!verificationRole) {
                return interaction.editReply({ embeds: [EmbedGenerator.errorEmbed(':x: | Failed to create a verification role')] });
            }
        }

        const unverifiedRole = await interaction.guild.roles.create({
            name: 'unverified',
            color: '#000001',
            hoist: false,
            mentionable: false,
            permissions: [],
            position: 0,
        }).catch(() => null);

        if (!unverifiedRole) {
            return interaction.editReply({ embeds: [EmbedGenerator.errorEmbed(':x: | Failed to create the unverified role')] });
        }

        if (!channel) {
            channel = await interaction.guild.channels.create({
                name: 'verification',
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: unverifiedRole.id,
                        allow: ['ViewChannel', 'ReadMessageHistory'],
                    },
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: ['ViewChannel', 'SendMessages'],
                    },
                ],
            }).catch(() => null) as TextChannel | null;

            if (!channel) {
                return interaction.editReply({ embeds: [EmbedGenerator.errorEmbed(':x: | Failed to create a verification channel')] });
            }

            for (const c of (await interaction.guild.channels.fetch()).values()) {
                if (c && channel.id !== c.id) {
                    await c.permissionOverwrites.create(unverifiedRole.id, { ViewChannel: false }).catch(() => null);
                }
            }
        } else {
            await channel.permissionOverwrites.edit(unverifiedRole.id, { ViewChannel: true, ReadMessageHistory: true }).catch(() => null);
            for (const c of (await interaction.guild.channels.fetch()).values()) {
                if (c && channel.id !== c.id) {
                    await c.permissionOverwrites.create(unverifiedRole.id, { ViewChannel: false }).catch(() => null);
                }
            }
        }

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('verification')
                .setLabel('Verify')
                .setStyle(ButtonStyle.Success)
        );

        if (type === 'button' || type === 'captcha') {
            await channel.send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        [
                            "This server uses Guardian's Verification System.",
                            'To complete verification please press the verify button.',
                        ].join('\n')
                    ).setAuthor({ name: client.user!.tag, iconURL: client.user!.displayAvatarURL() }),
                ],
                components: [buttonRow],
            });
        } else if (type === 'command') {
            await channel.send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        [
                            "This server uses Guardian's Verification System.",
                            'To complete verification please use the `/verify` command.',
                        ].join('\n')
                    ).setAuthor({ name: client.user!.tag, iconURL: client.user!.displayAvatarURL() }),
                ],
            });
        }

        dbGuild.verification.enabled = true;
        dbGuild.verification.version = type;
        dbGuild.verification.channel = channel.id;
        dbGuild.verification.role = verificationRole.id;
        dbGuild.verification.unverifiedRole = unverifiedRole.id;

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Type: ${type}`,
                `- Channel: <#${channel.id}>`,
                `- Verification role: <@&${verificationRole.id}>`,
            ].join('\n')
        ).setTitle('/verification setup command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return interaction.editReply({ embeds: [EmbedGenerator.basicEmbed('🔒 | Member verification has been enabled.')] });
    },
};
