require('dotenv').config();

// Polyfill for Node < 20: discord-html-transcripts/undici expects global File
if (typeof globalThis.File === 'undefined' && typeof globalThis.Blob !== 'undefined') {
    globalThis.File = class File extends Blob {
        constructor(bits, name, options) {
            super(bits, options || {});
            this.name = name || '';
            this.lastModified = (options && options.lastModified) || Date.now();
        }
    };
}

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

client.on('guildCreate', async (guild) => {
    const DevGuilds = ['1460113401631211664']; // replace with your dev guild of server IDs
    if (!DevGuilds.includes(guild.id)) {
        await guild.leave();
    }
});

client.on('messageCreate', (message) => {
    if (message.mentions.has(client.user)) {
        // Build an informative embed
        const embed = new Discord.EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Hello! I'm Guardian 🤖")
            .setDescription('Thanks for mentioning me!\n\n**My default prefix is:** `/` (I use [slash commands](https://discord.com/developers/docs/interactions/application-commands))\n\nUse `/help` to get a list of commands or explore the resources below!')
            .addFields(
                { name: 'Quick Start', value: 'Type `/help` for a full command list.' },
                { name: 'Support Server', value: '[Click here](https://discord.gg/)' },
            )
            .setFooter({ text: `Guardian Bot • Made for your server!`, iconURL: client.user.displayAvatarURL() });

        // Buttons for more actions/resources
        const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setLabel('Invite Me')
                .setStyle(Discord.ButtonStyle.Link)
                .setURL('https://discord.com/oauth2/authorize?client_id=' + client.user.id + '&permissions=8&scope=bot%20applications.commands'),
            new Discord.ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(Discord.ButtonStyle.Link)
                .setURL('https://discord.gg/'),
            new Discord.ButtonBuilder()
                .setLabel('Website')
                .setStyle(Discord.ButtonStyle.Link)
                .setURL('https://google.com')
        );

        message.reply({ embeds: [embed], components: [row] });
    }
});

Mongoose.connect(process.env.MONGODB_URL).then(async () => {
    console.log('Client is connected to the database.');

    await loadEvents(client);
    client.login(process.env.DISCORD_TOKEN).then(() => {});
});
