require('dotenv').config();

const Discord = require('discord.js');
const Mongoose = require('mongoose');
const Moment = require('moment');
const Express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');

const ExpiringDocumentManager = require('./Classes/ExpiringDocumentManager');
const EmbedGenerator = require('./Functions/embedGenerator');
const { loadEvents } = require('./Handlers/eventHandler');
const { pickUnique } = require('./Functions/pickUnique');
const router = require('./server');
const { processErrorHandler } = require('./Handlers/errorHandler');

const Infractions = require('./Schemas/Infractions');
const Giveaways = require('./Schemas/Giveaways');
const Reminders = require('./Schemas/Reminders');

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.MessageContent,
    ],
    partials: [
        Discord.Partials,
        Discord.Partials.Message,
        Discord.Partials.GuildMember,
        Discord.Partials.ThreadMember,
        Discord.Partials.Reaction,
    ],
});

// Increase max listeners to prevent memory leak warnings
client.setMaxListeners(20);

processErrorHandler();

client.commands = new Discord.Collection();
client.subCommands = new Discord.Collection();
client.expiringDocumentsManager = {
    infractions: new ExpiringDocumentManager(
        Infractions,
        'expires',
        async (infraction) => {
            if (infraction.type === 'ban') {
                const guild = await client.guilds
                    .fetch({ guild: infraction.guild })
                    .catch(() => null);
                if (guild)
                    guild.members.unban(infraction.user, 'Temporary ban expired').catch(() => null);
            }

            infraction.active = false;
            await infraction.save();
        },
        { active: true }
    ),
    giveaways: new ExpiringDocumentManager(
        Giveaways,
        'expires',
        async (giveaway) => {
            const guild = await client.guilds.fetch({ guild: giveaway.guild }).catch(() => null);
            if (guild) {
                /** @type {Discord.TextChannel} */ const channel = await guild.channels
                    .fetch(giveaway.channel)
                    .catch(() => null);
                if (channel) {
                    const message = await channel.messages
                        .fetch({ message: giveaway.giveaway })
                        .catch(() => null);
                    if (message) {
                        /** @type {Array<String>} */ const winners = pickUnique(
                            giveaway.entries,
                            giveaway.winners
                        );

                        const embed = new Discord.EmbedBuilder(message.embeds[0].data);
                        embed.setDescription(
                            [
                                giveaway.description ? giveaway.description : null,
                                giveaway.description ? '' : null,
                                `Winners: **${giveaway.winners}**, Entries: **${giveaway.entries.length}**`,
                                `Status: Ended`,
                            ]
                                .filter((text) => text !== null)
                                .join('\n')
                        );

                        await message.edit({ embeds: [embed], components: [] });

                        if (winners.length === 0) {
                            await channel.send({
                                embeds: [
                                    EmbedGenerator.errorEmbed(
                                        `💔 | Nobody entered the giveaway, there are no winners!`
                                    ),
                                ],
                                reply: { messageReference: message },
                            });
                        } else {
                            await channel.send({
                                content: winners.map((id) => `<@${id}>`).join(' '),
                                embeds: [EmbedGenerator.basicEmbed(`Congratulations winners!`)],
                                reply: { messageReference: message },
                            });
                        }
                    }
                }
            }

            giveaway.active = false;
            await giveaway.save();
        },
        { active: true }
    ),
    reminders: new ExpiringDocumentManager(Reminders, 'expires', async (reminder) => {
        const user = await client.users.fetch(reminder.user);
        if (user) {
            const embed = EmbedGenerator.basicEmbed(reminder.reminder).setAuthor({
                name: 'Guardian Reminder',
                iconURL: client.user.displayAvatarURL(),
            });
            if (reminder.repeating) {
                const ends = Moment().add(reminder.duration);
                embed.setDescription(
                    `${
                        embed.data.description
                    }\n\nYou will be reminded again in <t:${ends.unix()}:R>(<t:${ends.unix()}:f>)`
                );
            }

            await user.send({ embeds: [embed] });
        }

        if (reminder.repeating) {
            reminder.time = Date.now();
            reminder.expires = reminder.time + reminder.duration;

            return await reminder.save();
        } else {
            await reminder.delete();
        }
    }),
};

const app = Express();
let server;

if (process.env.LIVE === 'true') {
    server = https.createServer(
        {
            key: fs.readFileSync(`${__dirname}/data/server/privkey.pem`),
            cert: fs.readFileSync(`${__dirname}/data/server/fullchain.pem`),
        },
        app
    );
} else {
    server = http.createServer(app);
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    next();
});

app.use('/', router);

module.exports.client = client;
module.exports.server = server;

client.on('messageCreate', (message) => {
    if (!message.mentions.has(client.user)) return;
    if (message.reference) return;
    const contentWithoutBotMention = message.content
        .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
        .trim();
    if (contentWithoutBotMention.length > 0) return;

    const embed = new Discord.EmbedBuilder()
        .setColor(0x1a1a1a)
        .setTitle('Guardian')
        .setDescription(
            '```yaml\nProtection • Management • Engagement\n```\n\n**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**\n\n> **Advanced Server Protection System**\n> \n> � **Smart Moderation** • Auto-mod & warnings\n> 🔸 **Server Management** • Complete control\n> � **User Engagement** • Giveaways & events\n> 🔸 **Utility Tools** • Reminders & analytics'
        )
        .addFields(
            {
                name: '〈 📊 〉 **Statistics**',
                value: `**Servers:** \`${client.guilds.cache.size}\`\n**Users:** \`${client.users.cache.size}\`\n**Uptime:** <t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: true,
            },
            {
                name: '〈 ⚡ 〉 **Essential Commands**',
                value: '`/setup` • `/help` • `/giveaway`\n`/reminder` • `/userinfo` • `/moderation`',
                inline: true,
            }
        )
        .setThumbnail(client.user.displayAvatarURL({ format: 'png', size: 128 }))
        .setImage(
            'https://cdn.discordapp.com/attachments/1048758700984270918/1048758701648654396/banner.png'
        )
        .setFooter({
            text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGuardian • Advanced protection system`,
            iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

    const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
            .setLabel('Invite')
            .setStyle(Discord.ButtonStyle.Link)
            .setURL(
                'https://discord.com/oauth2/authorize?client_id=' +
                    client.user.id +
                    '&permissions=8&scope=bot%20applications.commands'
            ),
        new Discord.ButtonBuilder()
            .setLabel('Support')
            .setStyle(Discord.ButtonStyle.Link)
            .setURL('https://discord.gg/5nWZ8BJae4'),
        new Discord.ButtonBuilder()
            .setLabel('Commands')
            .setStyle(Discord.ButtonStyle.Secondary)
            .setCustomId('show_commands'),
        new Discord.ButtonBuilder()
            .setLabel('Vote')
            .setStyle(Discord.ButtonStyle.Link)
            .setURL('https://top.gg/bot/' + client.user.id)
    );

    message.reply({ embeds: [embed], components: [row] }).then((sent) => {
        const filter = (i) => i.customId === 'show_commands' && i.user.id === message.author.id;
        const collector = sent.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'show_commands') {
                const { buildHelpEmbeds } = require('./Commands/Information/help.js');
                const helpEmbeds = buildHelpEmbeds(client.commands, client, i.user);

                if (helpEmbeds.length > 0) {
                    await i.update({
                        embeds: [helpEmbeds[0]],
                        components: [
                            new Discord.ActionRowBuilder().addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('help_prev')
                                    .setEmoji('◀️')
                                    .setLabel('Previous')
                                    .setStyle(Discord.ButtonStyle.Primary)
                                    .setDisabled(true),
                                new Discord.ButtonBuilder()
                                    .setCustomId('help_next')
                                    .setEmoji('▶️')
                                    .setLabel('Next')
                                    .setStyle(Discord.ButtonStyle.Primary)
                                    .setDisabled(helpEmbeds.length === 1),
                                new Discord.ButtonBuilder()
                                    .setLabel('Back')
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setCustomId('back_to_main')
                            ),
                        ],
                    });

                    let currentPage = 0;
                    const helpFilter = (interaction) =>
                        ['help_prev', 'help_next', 'back_to_main'].includes(interaction.customId) &&
                        interaction.user.id === i.user.id;

                    const helpCollector = sent.createMessageComponentCollector({
                        filter: helpFilter,
                        time: 120000,
                    });

                    helpCollector.on('collect', async (interaction) => {
                        if (interaction.customId === 'help_prev') {
                            currentPage = Math.max(0, currentPage - 1);
                        } else if (interaction.customId === 'help_next') {
                            currentPage = Math.min(helpEmbeds.length - 1, currentPage + 1);
                        } else if (interaction.customId === 'back_to_main') {
                            await interaction.update({ embeds: [embed], components: [row] });
                            helpCollector.stop();
                            return;
                        }

                        await interaction.update({
                            embeds: [helpEmbeds[currentPage]],
                            components: [
                                new Discord.ActionRowBuilder().addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId('help_prev')
                                        .setEmoji('◀️')
                                        .setLabel('Previous')
                                        .setStyle(Discord.ButtonStyle.Primary)
                                        .setDisabled(currentPage === 0),
                                    new Discord.ButtonBuilder()
                                        .setCustomId('help_next')
                                        .setEmoji('▶️')
                                        .setLabel('Next')
                                        .setStyle(Discord.ButtonStyle.Primary)
                                        .setDisabled(currentPage === helpEmbeds.length - 1),
                                    new Discord.ButtonBuilder()
                                        .setLabel('Back')
                                        .setStyle(Discord.ButtonStyle.Secondary)
                                        .setCustomId('back_to_main')
                                ),
                            ],
                        });
                    });
                }
            }
        });
    });
});

Mongoose.set('strictQuery', false);
Mongoose.connect(process.env.MONGODB_URL).then(async () => {
    console.log('Client is connected to the database.');

    await loadEvents(client);
    client.login(process.env.DISCORD_TOKEN).then(() => {});
});
