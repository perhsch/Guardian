const { SlashCommandBuilder, Client, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const emojis = require('../../Config/emojis.json');

module.exports = {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('support')
        .setDMPermission(false)
        .setDescription('Get support and join our community'),
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const embed = new EmbedGenerator.basicEmbed()
            .setColor(0x5865F2)
            .setTitle(`${emojis.emojis.blurple_invite} Support`)
            .setDescription('[Join our support server](https://discord.gg/5nWZ8BJae4) for help and assistance!');

        return { embeds: [embed] };
    },
};
