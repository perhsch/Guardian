const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { translateResponse, translateText } = require('../../Functions/translate');

const CATEGORY_INFO = {
    administrator: { emoji: '⚙️', description: 'Server configuration & management' },
    backup: { emoji: '💾', description: 'Server backup & restore' },
    developer: { emoji: '🛠️', description: 'Bot development tools' },
    information: { emoji: 'ℹ️', description: 'Bot, server & user info' },
    moderator: { emoji: '🛡️', description: 'Moderation & safety tools' },
    public: { emoji: '🌐', description: 'User-facing features' },
    utility: { emoji: '🔧', description: 'Helpful utilities' },
};

/**
 * @param {Discord.Collection} commands
 * @param {Discord.Client} client
 */
function buildHelpEmbeds(commands, client) {
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
        .setAuthor({
            name: `${client.user.username} • Command List`,
            iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(
            `Welcome! Use the buttons below to browse commands by category.\n\n**Quick Links**\n• Use \`/language <language>\` to set your preferred language\n• Use \`/support\` for help & invite`
        )
        .addFields(
            Array.from(commandsByCategory.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, cmds]) => {
                    const info = CATEGORY_INFO[category] || {
                        emoji: '📋',
                        description: 'Commands',
                    };
                    return {
                        name: `${info.emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                        value: `${info.description}\n\`${cmds.length}\` commands`,
                        inline: true,
                    };
                })
        )
        .setFooter({ text: 'Page 1' })
        .setTimestamp();

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
                const desc = cmd.data?.description || 'No description';
                const subCmds = cmd.subCommands
                    ? `\n  ${cmd.subCommands.map((s) => `\`${s.data.name}\``).join(' · ')}`
                    : '';
                return `**\`/${name}\`**\n${desc}${subCmds}`;
            });

        const categoryEmbed = new Discord.EmbedBuilder()
            .setColor(0x5865f2)
            .setAuthor({
                name: `${client.user.username} • ${categoryName}`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setDescription(
                `${info.emoji} **${info.description}**\n\n${lines.join('\n\n')}`
            )
            .setFooter({ text: `Page ${embeds.length + 1}` })
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
        let embeds = buildHelpEmbeds(client.commands, client);
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
            embeds: [embeds[p].setFooter({ text: `Page ${p + 1}/${embeds.length}` })],
            components: [
                new Discord.ActionRowBuilder().addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('help_prev')
                        .setEmoji('◀️')
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setDisabled(p === 0),
                    new Discord.ButtonBuilder()
                        .setCustomId('help_home')
                        .setEmoji('🏠')
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setDisabled(p === 0),
                    new Discord.ButtonBuilder()
                        .setCustomId('help_next')
                        .setEmoji('▶️')
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setDisabled(p === embeds.length - 1)
                ),
            ],
        });

        const payload = { ...updatePayload(page), ephemeral, fetchReply: true };
        const sent = await interaction.reply(payload);

        const filter = (i) =>
            ['help_prev', 'help_next', 'help_home'].includes(i.customId) &&
            i.user.id === interaction.user.id;
        const collector = sent.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'help_prev') page = Math.max(0, page - 1);
            else if (i.customId === 'help_next') page = Math.min(embeds.length - 1, page + 1);
            else if (i.customId === 'help_home') page = 0;

            const payload = updatePayload(page);
            const footerText = `Page ${page + 1}/${embeds.length}`;
            const translatedFooter =
                userLang && userLang.toLowerCase() !== 'en'
                    ? await translateText(footerText, userLang)
                    : footerText;
            await i.update({
                ...payload,
                embeds: [embeds[page].setFooter({ text: translatedFooter })],
            });
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({
                    components: [
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('help_prev')
                                .setEmoji('◀️')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true),
                            new Discord.ButtonBuilder()
                                .setCustomId('help_home')
                                .setEmoji('🏠')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true),
                            new Discord.ButtonBuilder()
                                .setCustomId('help_next')
                                .setEmoji('▶️')
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
