import Discord, {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
    Client,
    User,
    ChatInputCommandInteraction,
} from 'discord.js';
import EmbedGenerator from '../../Functions/embedGenerator.ts';
import { translateText } from '../../Functions/translate.ts';
// @ts-ignore
import emojisConfig from '../../Config/emojis.json' assert { type: 'json' };

const emojis = emojisConfig.emojis;

interface CategoryInfo {
    emoji: string;
    description: string;
    color: number;
}

const CATEGORY_INFO: Record<string, CategoryInfo> = {
    administrator: {
        emoji: emojis.administrator || '⚙️',
        description: 'Server configuration & management',
        color: 0xed4245,
    },
    backup: {
        emoji: emojis.backup || '💾',
        description: 'Server backup & restore',
        color: 0x57f287,
    },
    information: {
        emoji: emojis.information || 'ℹ️',
        description: 'Bot, server & user info',
        color: 0x5865f2,
    },
    moderator: {
        emoji: emojis.moderator || '🛡️',
        description: 'Moderation & safety tools',
        color: 0xeb459e,
    },
    public: {
        emoji: emojis.public || '🌐',
        description: 'User-facing features',
        color: 0x57f287,
    },
    utility: {
        emoji: emojis.utility || '🔧',
        description: 'Helpful utilities',
        color: 0x5865f2,
    },
};

export function buildHelpEmbeds(commands: Collection<string, any>, client: Client, user: User) {
    const embeds: EmbedBuilder[] = [];
    const commandsByCategory = new Map<string, { name: string; cmd: any }[]>();

    for (const [name, cmd] of commands) {
        if (cmd.enabled === false || cmd.developer) continue;
        const category = (cmd.category || 'utility').toLowerCase();
        if (category === 'developer') continue; // Explicitly exclude developer category
        if (!commandsByCategory.has(category)) {
            commandsByCategory.set(category, []);
        }
        commandsByCategory.get(category)!.push({ name, cmd });
    }

    // Page 1: Overview
    const overviewEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setThumbnail(client.user!.displayAvatarURL({ size: 256 }))
        .setAuthor({
            name: `${client.user!.username} Command Center`,
            iconURL: client.user!.displayAvatarURL(),
        })
        .setTitle(`${emojis.blurple_bot || '🤖'} **Guardian Bot Help Menu**`)
        .setDescription(`>>> **Welcome to Guardian!** ${emojis.blurple_bot || '🤖'}`)
        .addFields(
            {
                name: `${emojis.statistics || '📊'} **Bot Statistics**`,
                value: `**🔢 Total Commands:** \`${commands.size}\`\n**📁 Categories:** \`${commandsByCategory.size}\`\n**🌐 Servers:** \`${client.guilds.cache.size}\`\n**👥 Users:** \`${client.users.cache.size}\``,
                inline: true,
            },
            {
                name: `${emojis['useful-links'] || '🔗'} **Quick Links**`,
                value: `**${emojis.blurple_invite || '🔗'}** [Support Server](${process.env['SUPPORT_SERVER'] || 'https://discord.gg/support'})\n**${emojis.blurple_bot || '🤖'}** [Bot Invite](${process.env['BOT_INVITE'] || 'https://discord.com/oauth2/authorize?client_id=' + client.user!.id})\n**${emojis.github || '📚'}** [Documentation](${process.env['DOCUMENTATION'] || 'https://github.com/Guardian-Discord-Bot/Guardian/wiki'})`,
                inline: true,
            }
        )
        .addFields({
            name: `📁 **Command Categories**`,
            value: Array.from(commandsByCategory.entries())
                .sort(([a], [b]) => {
                    const priority = [
                        'administrator',
                        'moderator',
                        'backup',
                        'information',
                        'public',
                        'utility',
                    ];
                    const aIndex = priority.indexOf(a);
                    const bIndex = priority.indexOf(b);
                    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                })
                .map(([category, cmds]) => {
                    const info = CATEGORY_INFO[category] || {
                        emoji: '📋',
                        description: 'Commands',
                        color: 0x95a5a6,
                    };
                    return `${info.emoji} **${category.charAt(0).toUpperCase() + category.slice(1)}** • \`${cmds.length}\` commands`;
                })
                .join('\n'),
            inline: false,
        })
        .setFooter({
            text: `Page 1/${commandsByCategory.size + 1} • Requested by ${user.username} • Guardian Bot`,
            iconURL: user.displayAvatarURL(),
        })
        .setTimestamp()
        .setImage(
            'https://cdn.discordapp.com/attachments/1043870997220687972/1043870998668779540/banner.png'
        );

    embeds.push(overviewEmbed);

    // Category pages
    const categoryOrder = [
        'administrator',
        'moderator',
        'backup',
        'information',
        'public',
        'utility',
    ];
    const sortedCategories = Array.from(commandsByCategory.entries()).sort(([a], [b]) => {
        const aIndex = categoryOrder.indexOf(a);
        const bIndex = categoryOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });

    for (const [category, cmds] of sortedCategories) {
        const info = CATEGORY_INFO[category] || {
            emoji: '📋',
            description: 'Commands',
            color: 0x5865f2,
        };
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

        const lines = cmds
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ name, cmd }) => {
                const desc = cmd.data?.description || 'No description available';
                const subCmds = cmd.subCommands
                    ? `\n  └─ **Subcommands:** ${cmd.subCommands.map((s: any) => `\`${s.data.name}\``).join(' • ')}`
                    : '';
                return `**\`/${name}\`**\n└─ ${desc}${subCmds}`;
            });

        const categoryEmbed = new EmbedBuilder()
            .setColor(info.color)
            .setThumbnail(client.user!.displayAvatarURL({ size: 128 }))
            .setAuthor({
                name: `${client.user!.username} Command Center`,
                iconURL: client.user!.displayAvatarURL(),
            })
            .setTitle(`${info.emoji} **${categoryName} Commands**`)
            .setDescription(
                `>>> **${info.description}**\n\n${lines.join('\n\n')}\n\n---\n**💡 Tips:** • Click command names to copy • Use Tab for autocomplete • Hover over options for help`
            )
            .addFields({
                name: `${emojis['useful-links'] || '🔗'} **Quick Actions**`,
                value: `• \`/help\` - Return to main menu\n• \`/support\` - Get additional help\n• \`/language\` - Change language settings`,
                inline: false,
            })
            .setFooter({
                text: `Page ${embeds.length + 1}/${commandsByCategory.size + 1} • Requested by ${user.username} • Guardian Bot`,
                iconURL: user.displayAvatarURL(),
            })
            .setTimestamp();

        embeds.push(categoryEmbed);
    }

    return embeds;
}

export default {
    data: new SlashCommandBuilder()
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
                    { name: 'Information', value: 'information' },
                    { name: 'Moderator', value: 'moderator' },
                    { name: 'Public', value: 'public' },
                    { name: 'Utility', value: 'utility' }
                )
        ),
    async execute(
        interaction: ChatInputCommandInteraction,
        client: Client,
        _dbGuild: any,
        dbUser: any
    ) {
        let embeds = buildHelpEmbeds(client.commands, client, interaction.user);
        if (embeds.length === 0) {
            return {
                embeds: [EmbedGenerator.errorEmbed('No commands available.')],
                ephemeral: true,
            };
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
            if (idx >= 0) startPage = idx + 1;
        }

        const ephemeral = true;
        if (embeds.length === 1) {
            return {
                embeds: [embeds[0]!.setFooter({ text: 'Page 1/1' })],
                ephemeral,
            };
        }

        let page = Math.min(startPage, embeds.length - 1);
        const updatePayload = (p: number) => ({
            embeds: [
                embeds[p]!.setFooter({
                    text: `Page ${p + 1}/${embeds.length} • Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                }),
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_first')
                        .setEmoji('⏮️')
                        .setLabel('First')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(p === 0),
                    new ButtonBuilder()
                        .setCustomId('help_prev')
                        .setEmoji('◀️')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(p === 0),
                    new ButtonBuilder()
                        .setCustomId('help_home')
                        .setEmoji('🏠')
                        .setLabel('Home')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(p === 0),
                    new ButtonBuilder()
                        .setCustomId('help_next')
                        .setEmoji('▶️')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(p === embeds.length - 1),
                    new ButtonBuilder()
                        .setCustomId('help_last')
                        .setEmoji('⏭️')
                        .setLabel('Last')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(p === embeds.length - 1)
                ),
            ],
        });

        const sent = await interaction.reply({
            ...updatePayload(page),
            ephemeral,
            fetchReply: true,
        });

        const filter = (i: any) =>
            ['help_first', 'help_prev', 'help_next', 'help_home', 'help_last'].includes(
                i.customId
            ) && i.user.id === interaction.user.id;
        const collector = sent.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async (i: any) => {
            if (i.customId === 'help_first') page = 0;
            else if (i.customId === 'help_prev') page = Math.max(0, page - 1);
            else if (i.customId === 'help_next') page = Math.min(embeds.length - 1, page + 1);
            else if (i.customId === 'help_home') page = 0;
            else if (i.customId === 'help_last') page = embeds.length - 1;

            const footerText = `Page ${page + 1}/${embeds.length} • Requested by ${interaction.user.username}`;
            const translatedFooter =
                userLang && userLang.toLowerCase() !== 'en'
                    ? await translateText(footerText, userLang)
                    : footerText;

            await i.update({
                ...updatePayload(page),
                embeds: [
                    embeds[page]!.setFooter({
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
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('help_first')
                                .setEmoji('⏮️')
                                .setLabel('First')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('help_prev')
                                .setEmoji('◀️')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('help_home')
                                .setEmoji('🏠')
                                .setLabel('Home')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('help_next')
                                .setEmoji('▶️')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('help_last')
                                .setEmoji('⏭️')
                                .setLabel('Last')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        ),
                    ],
                });
            } catch { }
        });
    },
};
