import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    Client,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CategoryChannel,
    TextChannel,
    Role,
} from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import { sendModLog } from '../../../Functions/modLog.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('setup')
        .setDescription('Configure the ticket system.')
        .addChannelOption((option) =>
            option
                .setName('category')
                .setDescription("Category to put ticket's in.")
                .addChannelTypes(ChannelType.GuildCategory)
        )
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('Channel used for opening tickets.')
                .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
            option
                .setName('staff_channel')
                .setDescription('Channel used for staff discussion')
                .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption((option) =>
            option.setName('role').setDescription("Staff role which can access ticket's")
        )
        .addChannelOption((option) =>
            option
                .setName('log_channel')
                .setDescription('Channel to post ticket transcripts when closed (optional)')
                .addChannelTypes(ChannelType.GuildText)
        ),

    async execute(interaction: ChatInputCommandInteraction, client: Client, dbGuild: any) {
        if (!interaction.guild) return;

        let category = interaction.options.getChannel('category') as CategoryChannel | null;
        let channel = interaction.options.getChannel('channel') as TextChannel | null;
        let staffChannel = interaction.options.getChannel('staff_channel') as TextChannel | null;
        let role = interaction.options.getRole('role') as Role | null;
        const logChannel = interaction.options.getChannel('log_channel') as TextChannel | null;

        if (!role) {
            role = await interaction.guild.roles
                .create({
                    name: 'Ticket Staff',
                    hoist: false,
                    color: '#000001',
                    mentionable: false,
                })
                .catch(() => null);
            if (!role) {
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Failed to create role.')],
                    ephemeral: true,
                });
            }
        }

        if (!category) {
            category = (await interaction.guild.channels
                .create({
                    name: 'Tickets',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            deny: ['ViewChannel', 'SendMessages'],
                        },
                        { id: role.id, allow: ['ViewChannel', 'SendMessages'] },
                    ],
                })
                .catch(() => null)) as CategoryChannel | null;
            if (!category) {
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Failed to create category.')],
                    ephemeral: true,
                });
            }
        }

        if (!staffChannel) {
            staffChannel = (await interaction.guild.channels
                .create({
                    name: 'staff-chat',
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                        },
                        {
                            id: role.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                        },
                    ],
                })
                .catch(() => null)) as TextChannel | null;
            if (!staffChannel) {
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Failed to create staff channel.')],
                    ephemeral: true,
                });
            }
        } else {
            await staffChannel.setParent(category.id).catch(() => null);
            await staffChannel.permissionOverwrites
                .edit(interaction.guild.roles.everyone.id, {
                    ViewChannel: false,
                    SendMessages: false,
                    ReadMessageHistory: false,
                })
                .catch(() => null);
            await staffChannel.permissionOverwrites
                .edit(role.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true })
                .catch(() => null);
        }

        if (!channel) {
            channel = (await interaction.guild.channels
                .create({
                    name: 'create-ticket',
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        { id: interaction.guild.roles.everyone.id, allow: ['ViewChannel'] },
                    ],
                })
                .catch(() => null)) as TextChannel | null;
            if (!channel) {
                return interaction.reply({
                    embeds: [EmbedGenerator.errorEmbed('Failed to create ticket channel.')],
                    ephemeral: true,
                });
            }
        } else {
            await channel.setParent(category.id).catch(() => null);
            await channel.permissionOverwrites
                .edit(interaction.guild.roles.everyone.id, {
                    ViewChannel: true,
                    SendMessages: true,
                })
                .catch(() => null);
        }

        await channel
            .send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        'Please press the button to create a ticket.'
                    ).setAuthor({
                        name: `Create a Ticket | ${client.user!.username}`,
                        iconURL: client.user!.displayAvatarURL(),
                    }),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('open-ticket')
                            .setEmoji('✉️')
                            .setLabel('Open Ticket')
                            .setStyle(ButtonStyle.Success)
                    ),
                ],
            })
            .catch(() => null);

        dbGuild.tickets.enabled = true;
        dbGuild.tickets.category = category.id;
        dbGuild.tickets.channel = channel.id;
        dbGuild.tickets.role = role.id;
        dbGuild.tickets.logChannel = logChannel?.id ?? null;

        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Category: ${category.name}`,
                `- Channel: <#${channel.id}>`,
                `- Support role: <@&${role.id}>`,
            ].join('\n')
        ).setTitle('/ticketadmin setup command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return {
            embeds: [
                EmbedGenerator.basicEmbed(
                    `🔒 | Ticket system has been enabled!\n\n• Category: ${category.name}\n• Panel: <#${channel.id}>\n• Staff role: <@&${role.id}>${logChannel ? `\n• Transcript log: <#${logChannel.id}>` : ''}`
                ),
            ],
        };
    },
};
