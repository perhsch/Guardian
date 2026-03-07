import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Client,
    TextChannel
} from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
import { sendModLog } from '../../Functions/modLog.ts';
import { generateTranscript } from '../../Functions/transcriptGenerator.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDMPermission(false)
        .setDescription('Bulk delete messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addNumberOption((option) =>
            option.setName('amount').setDescription('Amount of messages to delete.').setMinValue(1).setMaxValue(100).setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Reason for deleting.').setRequired(true)
        )
        .addUserOption((option) =>
            option.setName('target').setDescription('Only delete messages from this user.')
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client, dbGuild: any) {
        if (!interaction.guild || !interaction.channel) return;

        const amount = interaction.options.getNumber('amount', true);
        const reason = interaction.options.getString('reason', true);
        const target = interaction.options.getUser('target');
        const channel = interaction.channel as TextChannel;

        let messages = await channel.messages.fetch({ limit: amount });
        if (target) messages = messages.filter((message) => message.author.id === target.id);
        if (messages.size === 0) return { embeds: [EmbedGenerator.errorEmbed('No messages found.')], ephemeral: true };

        channel.bulkDelete(messages, true)
            .then(async () => {
                interaction.reply({
                    embeds: [EmbedGenerator.basicEmbed(`Cleared \`${messages.size}\` messages${target ? ` from ${target}` : ''}.`)],
                    ephemeral: true,
                });

                try {
                    const transcript = await generateTranscript(messages, channel);
                    const targetText = target ? target.tag || `<@${target.id}>` : 'None';
                    const logEmbed = EmbedGenerator.basicEmbed(
                        [`- Moderator: ${interaction.user.tag}`, `- Target: ${targetText}`, `- Channel: <#${channel.id}>`, `- Reason: ${reason}`].join('\n')
                    ).setTitle('/clear command used');
                    await sendModLog(interaction.guild!, dbGuild, logEmbed, [transcript]);
                } catch (err) {
                    console.error('Error creating/sending clear transcript/log:', err);
                }
            })
            .catch(() => interaction.reply({ embeds: [EmbedGenerator.errorEmbed()], ephemeral: true }));
    },
};
