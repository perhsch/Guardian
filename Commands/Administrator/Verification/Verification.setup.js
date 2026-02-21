const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandSubcommandBuilder()
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
                .setDescription(
                    'Role to give when verification is completed. (Will be created if unspecified)'
                )
        )
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription(
                    'Channel used for unverified members. (Will be created if unspecified)'
                )
                .addChannelTypes(Discord.ChannelType.GuildText)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        /** @type { 'button' | 'command' | 'captcha' } */ const type =
            interaction.options.getString('type', true);
        /** @type {Discord.Role} */ let verificationRole = interaction.options.getRole('role');
        /** @type {Discord.TextChannel} */ let channel = interaction.options.getChannel('channel');

        await interaction.deferReply();

        // Verification role = role given when member completes verification
        if (!verificationRole) {
            verificationRole = await interaction.guild.roles
                .create({
                    name: 'Verified',
                    color: '#000001',
                    hoist: false,
                    mentionable: false,
                    permissions: [],
                    position: 0,
                })
                .catch(() => null);

            if (!verificationRole)
                return EmbedGenerator.errorEmbed(':x: | Failed to create a verification role');
        }

        // Unverified role = given to new members, removed when they verify (auto-created)
        const unverifiedRole = await interaction.guild.roles
            .create({
                name: 'unverified',
                color: '#000001',
                hoist: false,
                mentionable: false,
                permissions: [],
                position: 0,
            })
            .catch(() => null);

        if (!unverifiedRole)
            return EmbedGenerator.errorEmbed(':x: | Failed to create the unverified role');

        // Check if unverifiedRole exists before using it
        if (!unverifiedRole || !unverifiedRole.id) {
            return EmbedGenerator.errorEmbed(':x: | Invalid unverified role created');
        }

        if (!channel) {
            channel = await interaction.guild.channels
                .create({
                    name: 'verification',
                    type: Discord.ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: unverifiedRole?.id || interaction.guild.roles.everyone.id,
                            allow: ['ViewChannel', 'ReadMessageHistory'],
                        },
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['ViewChannel', 'SendMessages'],
                        },
                    ],
                })
                .catch(() => null);

            if (!channel)
                return EmbedGenerator.errorEmbed(':x: | Failed to create a verification channel');

            for (const c of (await interaction.guild.channels.fetch()).values())
                if (channel.id !== c.id)
                    await c.permissionOverwrites
                        .create(unverifiedRole?.id || interaction.guild.roles.everyone.id, {
                            ViewChannel: false,
                        })
                        .catch(() => null);
        } else {
            await channel.permissionOverwrites
                .edit(unverifiedRole?.id || interaction.guild.roles.everyone.id, {
                    ViewChannel: true,
                    ReadMessageHistory: true,
                })
                .catch(() => null);
            for (const c of (await interaction.guild.channels.fetch()).values())
                if (channel.id !== c.id)
                    await c.permissionOverwrites
                        .create(unverifiedRole?.id || interaction.guild.roles.everyone.id, {
                            ViewChannel: false,
                        })
                        .catch(() => null);
        }

        if (type === 'button') {
            await channel.send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        [
                            "This server uses Guardian's Verification System.",
                            'To complete verification please press the verify button.',
                        ].join('\n')
                    ).setAuthor({ name: client.user.tag, iconURL: client.user.displayAvatarURL() }),
                ],
                components: [
                    new Discord.ActionRowBuilder().addComponents([
                        new Discord.ButtonBuilder()
                            .setCustomId('verification')
                            .setLabel('Verify')
                            .setStyle(Discord.ButtonStyle.Success),
                    ]),
                ],
            });
        } else if (type === 'command') {
            await channel.send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        [
                            "This server uses Guardian's Verification System.",
                            'To complete verification please use the `/verify` command.',
                        ].join('\n')
                    ).setAuthor({ name: client.user.tag, iconURL: client.user.displayAvatarURL() }),
                ],
            });
        } else if (type === 'captcha') {
            await channel.send({
                embeds: [
                    EmbedGenerator.basicEmbed(
                        [
                            "This server uses Guardian's Verification System.",
                            'To complete verification please press the verify button.',
                        ].join('\n')
                    ).setAuthor({ name: client.user.tag, iconURL: client.user.displayAvatarURL() }),
                ],
                components: [
                    new Discord.ActionRowBuilder().addComponents([
                        new Discord.ButtonBuilder()
                            .setCustomId('verification')
                            .setLabel('Verify')
                            .setStyle(Discord.ButtonStyle.Success),
                    ]),
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
                `- Verification role: ${verificationRole}`,
            ].join('\n')
        ).setTitle('/verification setup command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return EmbedGenerator.basicEmbed('🔒 | Member verification has been enabled.');
    },
};
