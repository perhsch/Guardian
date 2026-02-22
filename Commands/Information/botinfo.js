const Discord = require('discord.js');
const Mongoose = require('mongoose');

const EmbedGenerator = require('../../Functions/embedGenerator');
const Guilds = require('../../Schemas/Guilds');
const { emojis: e } = require('../../Config/emojis.json');

module.exports = {
    enabled: true,
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

        // Calculate memory usage
        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);

        // Get total users across all guilds
        const totalUsers = interaction.client.guilds.cache.reduce(
            (acc, guild) => acc + guild.memberCount,
            0
        );

        // Get bot stats
        const totalChannels = interaction.client.channels.cache.size;
        const totalEmojis = interaction.client.emojis.cache.size;

        const replyEmbed = new Discord.EmbedBuilder()
            .setTitle(`${e.blurple_bot} Guardian Bot Information`)
            .setDescription('**Advanced Discord moderation & management bot**')
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
            .setColor('#7289DA')
            .addFields(
                {
                    name: `${e.blurple_bot} **Statistics**`,
                    value: `\`\`\`🌐 Guilds: ${interaction.client.guilds.cache.size}\n👥 Users: ${totalUsers.toLocaleString()}\n💬 Channels: ${totalChannels.toLocaleString()}\n😀 Emojis: ${totalEmojis}\`\`\``,
                    inline: false,
                },
                {
                    name: `${e.blurple_cog} **System Information**`,
                    value: `\`\`\`🔧 Node.js: v${process.version}\n📦 Discord.js: v${Discord.version}\n🗄️ Mongoose: v${Mongoose.version}\n💾 Memory: ${memoryMB}MB / ${memoryTotal}MB\`\`\``,
                    inline: false,
                },
                {
                    name: `${e.blurple_chat} **Uptime**`,
                    value: `\`\`\`${days}d ${hours}h ${minutes}m ${seconds}s\`\`\``,
                    inline: true,
                },
                {
                    name: `${e.blurple_link} **Links**`,
                    value: `${e.github} [**Github**](https://github.com/Guardians-Stuff/Guardian) | ${e.blurple_link} [**Invite**](https://discord.com/oauth2/authorize?client_id=1130480504097996832&scope=bot)`,
                    inline: true,
                },
                {
                    name: `${e.blurple_employee} **Developers**`,
                    value: "`Brennan's Development`",
                    inline: true,
                },
                {
                    name: `${e.blurple_discord_at} **Bot ID**`,
                    value: `\`${interaction.client.user.id}\``,
                    inline: true,
                }
            )
            .setFooter({
                text: 'Guardian Bot • Advanced Protection & Moderation',
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setTimestamp();

        return interaction.reply({ embeds: [replyEmbed] });
    },
};
