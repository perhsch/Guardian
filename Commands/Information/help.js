const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { translateResponse, translateText } = require('../../Functions/translate');

const CATEGORY_INFO = {
    administrator: {
        emoji: '⚙️',
        description: 'Server configuration & management',
        color: 0xed4245,
    },
    backup: {
        emoji: '💾',
        description: 'Server backup & restore',
        color: 0x57f287,
    },
    developer: {
        emoji: '🛠️',
        description: 'Bot development tools',
        color: 0xfee75c,
    },
    information: {
        emoji: 'ℹ️',
        description: 'Bot, server & user info',
        color: 0x5865f2,
    },
    moderator: {
        emoji: '🛡️',
        description: 'Moderation & safety tools',
        color: 0xeb459e,
    },
    public: {
        emoji: '🌐',
        description: 'User-facing features',
        color: 0x57f287,
    },
    utility: {
        emoji: '🔧',
        description: 'Helpful utilities',
        color: 0x5865f2,
    },
};

/**
 * @param {Discord.Collection} commands
 * @param {Discord.Client} client
 * @param {Discord.User} user
 */
function buildHelpEmbeds(commands, client, user) {
    const embeds = [];
    const commandsByCategory = new Map();

    for (const [name, cmd] of commands) {
        if (cmd.enabled === false || cmd.developer) continue;
        const category = (cmd.category || 'utility').toLowerCase();
        if (!commandsByCategory.has(category)) {
            commandsByCategory.set(category, []);
        }
        commandsByCategory.set(category, [...commandsByCategory.get(category), { name, cmd }]);
    }

    // Page 1: Overview
    const overviewEmbed = new Discord.EmbedBuilder()
        .setColor(0x5865f2)
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .setAuthor({
            name: `${client.user.username} Command Center`,
            iconURL: client.user.displayAvatarURL(),
        })
        .setTitle('🌟 Welcome to the Help Menu')
        .setDescription(
            `>>> 🎯 **Navigate with ease**\nUse the buttons below to explore our command categories. Each category is carefully organized to help you find exactly what you need!\n\n🚀 **Quick Start**\n• \`/language <language>\` 🌍 - Set your preferred language\n• \`/support\` 🤝 - Get help & invite links\n• \`/setup\` ⚙️ - Configure the bot for your server`
        )
        .addFields(
            {
                name: '📊 **Statistics**',
                value: `**Total Commands:** \`${commands.size}\`\n**Categories:** \`${commandsByCategory.size}\`\n**Servers:** \`${client.guilds.cache.size}\``,
                inline: true,
            },
            {
                name: '🔗 **Useful Links**',
                value: `• [Support Server](${process.env.SUPPORT_SERVER || '#'})\n• [Bot Invite](${process.env.BOT_INVITE || '#'})\n• [Documentation](${process.env.DOCUMENTATION || '#'})`,
                inline: true,
            }
        )
        .addFields(
            Array.from(commandsByCategory.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, cmds]) => {
                    const info = CATEGORY_INFO[category] || {
                        emoji: '📋',
                        description: 'Commands',
                        color: 0x95a5a6,
                    };
                    return {
                        name: `${info.emoji} **${category.charAt(0).toUpperCase() + category.slice(1)}**`,
                        value: `> ${info.description}\n> **\`${cmds.length}\`** commands available`,
                        inline: true,
                    };
                })
        )
        .setFooter({
            text: `Page 1/${commandsByCategory.size + 1} • Requested by ${user.username}`,
            iconURL: user.displayAvatarURL(),
        })
        .setTimestamp()
        .setImage(
            'https://cdn.discordapp.com/attachments/1043870997220687972/1043870998668779540/banner.png'
        );

    embeds.push(overviewEmbed);

    // Category pages
    const sortedCategories = Array.from(commandsByCategory.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
    );

    for (const [category, cmds] of sortedCategories) {
        const info = CATEGORY_INFO[category] || {
            emoji: '📋',
            description: 'Commands',
        };
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

        const lines = cmds
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ name, cmd }) => {
                const desc = cmd.data?.description || 'No description available';
                const subCmds = cmd.subCommands
                    ? `\n  └─ **Subcommands:** ${cmd.subCommands.map((s) => `\`${s.data.name}\``).join(' • ')}`
                    : '';
                return `**\`/${name}\`**\n└─ ${desc}${subCmds}`;
            });

        const categoryEmbed = new Discord.EmbedBuilder()
            .setColor(info.color || 0x5865f2)
            .setThumbnail(client.user.displayAvatarURL({ size: 128 }))
            .setAuthor({
                name: `${client.user.username} Command Center`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setTitle(`${info.emoji} ${categoryName} Commands`)
            .setDescription(`>>> **${info.description}**\n\n${lines.join('\n\n')}`)
            .addFields({
                name: '📝 **Usage Tips**',
                value: `• Click on any command name to copy it\n• Use Tab to autocomplete commands\n• Hover over options for descriptions`,
                inline: false,
            })
            .setFooter({
                text: `Page ${embeds.length + 1}/${commandsByCategory.size + 1} • Requested by ${user.username}`,
                iconURL: user.displayAvatarURL(),
            })
            .setTimestamp();

        embeds.push(categoryEmbed);
    }

    return embeds;
}

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('help')
        .setDescription('View all commands and categories')
        .setDMPermission(false)
        .addStringOption((option) =>
            option
                .setName('category')
                .setDescription('Jump to a specific category')
                .setRequired(false)
                .addChoices(
                    { name: 'Administrator', value: 'administrator' },
                    { name: 'Backup', value: 'backup' },
                    { name: 'Developer', value: 'developer' },
                    { name: 'Information', value: 'information' },
                    { name: 'Moderator', value: 'moderator' },
                    { name: 'Public', value: 'public' },
                    { name: 'Utility', value: 'utility' }
                )
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     * @param {import('../../Classes/UsersManager').UsersManager} dbUser
     */
    async execute(interaction, client, dbGuild, dbUser) {
        let embeds = buildHelpEmbeds(client.commands, client, interaction.user);
        if (embeds.length === 0) {
            return EmbedGenerator.errorEmbed('No commands available.');
        }

        const userLang = dbUser?.language;

        const categoryChoice = interaction.options.getString('category');
        let startPage = 0;
        if (categoryChoice) {
            const categories = Array.from(
                new Set(
                    [...client.commands.values()]
                        .filter((c) => c.enabled !== false && !c.developer)
                        .map((c) => (c.category || 'utility').toLowerCase())
                )
            ).sort();
            const idx = categories.indexOf(categoryChoice);
            if (idx >= 0) startPage = idx + 1; // +1 because page 0 is overview
        }

        const ephemeral = true;
        if (embeds.length === 1) {
            return {
                embeds: [embeds[0].setFooter({ text: 'Page 1/1' })],
                ephemeral,
            };
        }

        let page = Math.min(startPage, embeds.length - 1);
        const updatePayload = (p) => ({
            embeds: [
                embeds[p].setFooter({
                    text: `Page ${p + 1}/${embeds.length} • Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                }),
            ],
            components: [
                new Discord.ActionRowBuilder().addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('help_first')
                        .setEmoji('⏮️')
                        .setLabel('First')
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setDisabled(p === 0),
                    new Discord.ButtonBuilder()
                        .setCustomId('help_prev')
                        .setEmoji('◀️')
                        .setLabel('Previous')
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setDisabled(p === 0),
                    new Discord.ButtonBuilder()
                        .setCustomId('help_home')
                        .setEmoji('🏠')
                        .setLabel('Home')
                        .setStyle(Discord.ButtonStyle.Success)
                        .setDisabled(p === 0),
                    new Discord.ButtonBuilder()
                        .setCustomId('help_next')
                        .setEmoji('▶️')
                        .setLabel('Next')
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setDisabled(p === embeds.length - 1),
                    new Discord.ButtonBuilder()
                        .setCustomId('help_last')
                        .setEmoji('⏭️')
                        .setLabel('Last')
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setDisabled(p === embeds.length - 1)
                ),
            ],
        });

        const payload = { ...updatePayload(page), ephemeral, fetchReply: true };
        const sent = await interaction.reply(payload);

        const filter = (i) =>
            ['help_first', 'help_prev', 'help_next', 'help_home', 'help_last'].includes(
                i.customId
            ) && i.user.id === interaction.user.id;
        const collector = sent.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'help_first') page = 0;
            else if (i.customId === 'help_prev') page = Math.max(0, page - 1);
            else if (i.customId === 'help_next') page = Math.min(embeds.length - 1, page + 1);
            else if (i.customId === 'help_home') page = 0;
            else if (i.customId === 'help_last') page = embeds.length - 1;

            const payload = updatePayload(page);
            const footerText = `Page ${page + 1}/${embeds.length} • Requested by ${interaction.user.username}`;
            const translatedFooter =
                userLang && userLang.toLowerCase() !== 'en'
                    ? await translateText(footerText, userLang)
                    : footerText;
            await i.update({
                ...payload,
                embeds: [
                    embeds[page].setFooter({
                        text: translatedFooter,
                        iconURL: interaction.user.displayAvatarURL(),
                    }),
                ],
            });
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({
                    components: [
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('help_first')
                                .setEmoji('⏮️')
                                .setLabel('First')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true),
                            new Discord.ButtonBuilder()
                                .setCustomId('help_prev')
                                .setEmoji('◀️')
                                .setLabel('Previous')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true),
                            new Discord.ButtonBuilder()
                                .setCustomId('help_home')
                                .setEmoji('🏠')
                                .setLabel('Home')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true),
                            new Discord.ButtonBuilder()
                                .setCustomId('help_next')
                                .setEmoji('▶️')
                                .setLabel('Next')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true),
                            new Discord.ButtonBuilder()
                                .setCustomId('help_last')
                                .setEmoji('⏭️')
                                .setLabel('Last')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        ),
                    ],
                });
            } catch {
                // Message may have been deleted
            }
        });
    },
};
