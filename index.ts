import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
    TextChannel,
} from 'discord.js';
import Mongoose from 'mongoose';
import Moment from 'moment';
import Express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import ExpiringDocumentManager from './Classes/ExpiringDocumentManager.ts';
import * as EmbedGenerator from './Functions/embedGenerator.ts';
import { loadEvents } from './Handlers/eventHandler.ts';
import { pickUnique } from './Functions/pickUnique.ts';
import createRouter from './server.ts';
import { processErrorHandler, initializeErrorHandler } from './Handlers/errorHandler.ts';
import { buildHelpEmbeds } from './Commands/Information/help.ts';

import Infractions from './Schemas/Infractions.ts';
import type { IInfraction } from './Schemas/Infractions.ts';
import Giveaways from './Schemas/Giveaways.ts';
import type { IGiveaway } from './Schemas/Giveaways.ts';
import Reminders from './Schemas/Reminders.ts';
import type { IReminder } from './Schemas/Reminders.ts';
import Users from './Schemas/Users.ts';
import type { IUser } from './Schemas/Users.ts';

import type { GuardianClient } from './types';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.GuildMember, Partials.ThreadMember, Partials.Reaction],
}) as GuardianClient;

client.setMaxListeners(20);
initializeErrorHandler(client);
processErrorHandler();

client.commands = new Collection();
client.subCommands = new Collection();

client.expiringDocumentsManager = {
    infractions: new ExpiringDocumentManager<IInfraction>(
        Infractions,
        'expires',
        async (infraction) => {
            if (infraction.type === 'ban') {
                const guild = await client.guilds.fetch(infraction.guild).catch(() => null);
                if (guild)
                    await guild.members
                        .unban(infraction.user, 'Temporary ban expired')
                        .catch(() => null);
            }

            infraction.active = false;
            await infraction.save();
        },
        { active: true }
    ),
    giveaways: new ExpiringDocumentManager<IGiveaway>(
        Giveaways,
        'expires',
        async (giveaway) => {
            const guild = await client.guilds.fetch(giveaway.guild).catch(() => null);
            if (guild) {
                const channel = (await guild.channels
                    .fetch(giveaway.channel)
                    .catch(() => null)) as TextChannel | null;
                if (channel) {
                    const message = await channel.messages
                        .fetch(giveaway.giveaway)
                        .catch(() => null);
                    if (message && message.embeds[0]) {
                        const winners = pickUnique(giveaway.entries, giveaway.winners);

                        const embed = new EmbedBuilder(message.embeds[0].data);
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
                                reply: { messageReference: message.id },
                            });
                        } else {
                            await channel.send({
                                content: winners.map((id) => `<@${id}>`).join(' '),
                                embeds: [EmbedGenerator.basicEmbed(`Congratulations winners!`)],
                                reply: { messageReference: message.id },
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
    reminders: new ExpiringDocumentManager<IReminder>(Reminders, 'expires', async (reminder) => {
        const user = await client.users.fetch(reminder.user).catch(() => null);
        if (user) {
            const embed = EmbedGenerator.basicEmbed(reminder.reminder).setAuthor({
                name: 'Guardian Reminder',
                iconURL: client.user?.displayAvatarURL(),
            });
            if (reminder.repeating) {
                const ends = Moment().add(reminder.duration);
                embed.setDescription(
                    `${
                        embed.data.description
                    }\n\nYou will be reminded again in <t:${ends.unix()}:R>(<t:${ends.unix()}:f>)`
                );
            }

            await user.send({ embeds: [embed] }).catch(() => null);
        }

        if (reminder.repeating) {
            reminder.time = Date.now();
            reminder.expires = reminder.time + reminder.duration;

            return await reminder.save();
        } else {
            await reminder.delete();
            return;
        }
    }),
};

const app = Express();
let server: any;

if (process.env['LIVE'] === 'true') {
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

app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    next();
});

const router = createRouter(client);
app.use('/', router);

export { client, server };

client.on('ready', async () => {
    console.log(`[SHARD ${client.shard?.ids[0] || 0}] Client is ready!`);
    console.log(`[SHARD ${client.shard?.ids[0] || 0}] Logged in as ${client.user?.tag}`);
    console.log(`[SHARD ${client.shard?.ids[0] || 0}] Guilds: ${client.guilds.cache.size}`);

    client.shardInfo = {
        id: client.shard?.ids[0] || 0,
        count: client.shard?.count || 1,
    };

    if (client.shard) {
        try {
            const { manager } = await import('./shard.ts');
            client.shardManager = {
                broadcastToAll: manager.broadcastToAll.bind(manager),
                sendToShard: manager.sendToShard.bind(manager),
                getGlobalStats: manager.getGlobalStats.bind(manager),
                findUserGuilds: manager.findUserGuilds.bind(manager),
                restartShard: manager.restartShard.bind(manager),
                getShardHealth: manager.getShardHealth.bind(manager),
            };
        } catch (error) {
            console.error('Failed to initialize shard manager:', error);
        }
    }
});

client.on('messageCreate', async (message: Message) => {
    if (!client.user) return;
    if (!message.mentions.has(client.user)) return;
    if (message.reference) return;

    const contentWithoutBotMention = message.content
        .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
        .trim();

    // Secret rocky command
    if (contentWithoutBotMention === 'rocky') {
        // Check if user exists in database
        let userDoc = await Users.findOne({
            user: message.author.id,
            guild: message.guild?.id,
        }).catch(() => null);

        // Create user document if it doesn't exist
        if (!userDoc) {
            userDoc = new Users({
                user: message.author.id,
                guild: message.guild?.id,
            });
        }

        // Check if user already knows this secret word
        if (userDoc.secretWords.includes('rocky')) {
            await message.reply({ content: 'You already know it!' });
        } else {
            // Add the secret word to user's known secrets
            userDoc.secretWords.push('rocky');
            await userDoc.save();
            await message.reply({ content: ':o you won! Your now special :3' });

            // Log to channel
            const secretChannelId = '1481683980767199373';
            const secretChannel = await client.channels.fetch(secretChannelId).catch(() => null);

            if (secretChannel && secretChannel.isTextBased() && 'send' in secretChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🔐 Secret Word Discovered!')
                    .setDescription(
                        `**${message.author.username}** (${message.author.id}) discovered a secret word!`
                    )
                    .setColor(0x00ff00)
                    .addFields(
                        {
                            name: '👤 User',
                            value: `${message.author.username} (${message.author.id})`,
                            inline: true,
                        },
                        {
                            name: '🏠 Guild',
                            value: `${message.guild?.name} (${message.guild?.id})`,
                            inline: true,
                        },
                        {
                            name: '📊 Total Secrets Known',
                            value: `${userDoc.secretWords.length}`,
                            inline: true,
                        }
                    )
                    .setTimestamp()
                    .setFooter({
                        text: 'Guardian Secret Word Tracker',
                    });

                await secretChannel.send({ embeds: [embed] }).catch(() => null);
            }
        }
        return;
    }

    if (contentWithoutBotMention.length > 0) return;

    const embed = new EmbedBuilder()
        .setColor(0x1a1a1a)
        .setTitle('Guardian')
        .setDescription(
            '```yaml\nProtection • Management • Engagement\n```\n\n**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**\n\n> **Advanced Server Protection System**\n> \n> 🛡️ **Smart Moderation** • Auto-mod & warnings\n> 🔸 **Server Management** • Complete control\n> 🤝 **User Engagement** • Giveaways & events\n> 🔸 **Utility Tools** • Reminders & analytics'
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
        .setThumbnail(client.user.displayAvatarURL({ forceStatic: false }))
        .setImage('https://i.imgur.com/XeEI7XJ.png')
        .setFooter({
            text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGuardian • Advanced protection system`,
            iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel('Invite')
            .setStyle(ButtonStyle.Link)
            .setURL(
                'https://discord.com/oauth2/authorize?client_id=' +
                    client.user.id +
                    '&permissions=68479744&scope=bot%20applications.commands'
            ),
        new ButtonBuilder()
            .setLabel('Support')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/5nWZ8BJae4'),
        new ButtonBuilder()
            .setLabel('Commands')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('show_commands'),
        new ButtonBuilder()
            .setLabel('Vote')
            .setStyle(ButtonStyle.Link)
            .setURL('https://top.gg/bot/' + client.user.id)
    );

    const sent = await message.reply({ embeds: [embed], components: [row] });

    const filter = (i: any) => i.customId === 'show_commands' && i.user.id === message.author.id;
    const collector = sent.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (i: any) => {
        if (i.customId === 'show_commands') {
            const helpEmbeds = buildHelpEmbeds(client.commands, client, i.user);

            if (helpEmbeds.length > 0) {
                await i.update({
                    embeds: [helpEmbeds[0]],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('help_prev')
                                .setEmoji('◀️')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('help_next')
                                .setEmoji('▶️')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(helpEmbeds.length === 1),
                            new ButtonBuilder()
                                .setLabel('Back')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('back_to_main')
                        ),
                    ],
                });

                let currentPage = 0;
                const helpFilter = (interaction: any) =>
                    ['help_prev', 'help_next', 'back_to_main'].includes(interaction.customId) &&
                    interaction.user.id === i.user.id;

                const helpCollector = sent.createMessageComponentCollector({
                    filter: helpFilter,
                    time: 120000,
                });

                helpCollector.on('collect', async (interaction: any) => {
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
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('help_prev')
                                    .setEmoji('◀️')
                                    .setLabel('Previous')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(currentPage === 0),
                                new ButtonBuilder()
                                    .setCustomId('help_next')
                                    .setEmoji('▶️')
                                    .setLabel('Next')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(currentPage === helpEmbeds.length - 1),
                                new ButtonBuilder()
                                    .setLabel('Back')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setCustomId('back_to_main')
                            ),
                        ],
                    });
                });
            }
        }
    });
});

Mongoose.set('strictQuery', false);
if (process.env['MONGODB_URL']) {
    Mongoose.connect(process.env['MONGODB_URL'])
        .then(async () => {
            console.log(
                `[SHARD ${client.shard?.ids[0] || 0}] Client is connected to the database.`
            );

            await loadEvents(client);
            client.login(process.env['DISCORD_TOKEN']).then(() => {});
        })
        .catch((error) => {
            console.error('Failed to connect to MongoDB:', error);
            process.exit(1);
        });
} else {
    console.error('MONGODB_URL is not defined in .env');
    process.exit(1);
}
