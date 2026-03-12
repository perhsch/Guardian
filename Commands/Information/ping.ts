import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDMPermission(false)
        .setDescription('Check the bot\'s latency and response time'),

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const sent = await interaction.reply({
            content: '🏓 Pinging...',
            fetchReply: true,
            ephemeral: true
        });

        const websocketLatency = client.ws.ping;
        const roundTripLatency = sent.createdTimestamp - interaction.createdTimestamp;

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🏓 Pong!')
            .addFields(
                {
                    name: '⚡ WebSocket Latency',
                    value: `\`${websocketLatency}ms\``,
                    inline: true
                },
                {
                    name: '🔄 Round-trip Latency',
                    value: `\`${roundTripLatency}ms\``,
                    inline: true
                },
                {
                    name: '📡 API Response Time',
                    value: websocketLatency < 100 ? '🟢 Excellent' :
                        websocketLatency < 200 ? '🟡 Good' :
                            websocketLatency < 500 ? '🟠 Fair' : '🔴 Poor',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({
                text: `Shard ${client.shard?.ids[0] || 0} | Guardian Bot`
            });

        await interaction.editReply({ embeds: [embed] });
    },
};
