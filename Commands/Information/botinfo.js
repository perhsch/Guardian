const Discord = require('discord.js');
const Mongoose = require('mongoose');

const Guilds = require('../../Schemas/Guilds');
const { emojis: e } = require('../../Config/emojis.json');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Receive information about the bot')
        .setDMPermission(false),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const replyEmbed = new Discord.EmbedBuilder()
            .addFields(
                {
                    name: `${e.blurple_discord_at} Name`,
                    value: `Guardian`,
                    inline: true,
                },
                {
                    name: `${e.blurple_invite} ID`,
                    value: `1053736067129421884`,
                    inline: true,
                },
                {
                    name: `${e.blurple_employee} Developers`,
                    value: `Brennan (@rockyrocksrock)`,
                    inline: true,
                },
                {
                    name: `${e.blurple_bot} Total Guilds`,
                    value: `\`${interaction.client.guilds.cache.size}\``,
                    inline: true,
                },
                {
                    name: `${e.blurple_members} Total Users`,
                    value: `\`${
                        (
                            await Guilds.aggregate([
                                { $unwind: { path: '$members' } },
                                { $group: { _id: null, totalMembers: { $sum: 1 } } },
                            ])
                        )[0].totalMembers
                    }\``,
                    inline: true,
                },
                {
                    name: `${e.blurple_chat} Uptime`,
                    value: `\`${days}d:${hours}h:${minutes}m:${seconds}s\``,
                    inline: true,
                },
                {
                    name: `Dependency versions`,
                    value: `${e.nodejs} NodeJS: \`${process.version}\`\n${e.discord_js} Discord.JS: \`${Discord.version}\`\n${e.blurple_lock} Mongoose: \`${Mongoose.version}\``,
                    inline: true,
                },
                {
                    name: `Links`,
                    value: `${e.github} [**Github**](https://github.com/Guardians-Stuff/Guardian)\n${e.blurple_link} [**Invite**](https://discord.com/oauth2/authorize?client_id=1130480504097996832&scope=bot)`,
                    inline: true,
                }
            )
            .setColor('Blue')
            .setTimestamp();

        return replyEmbed;
    },
};
