import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import Moment from 'moment';
import ms from 'ms';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Reminders from '../../../Schemas/Reminders.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('create')
        .setDescription('Create a reminder.')
        .addStringOption((option) =>
            option
                .setName('reminder')
                .setDescription('Reminder to send you.')
                .setRequired(true)
                .setMaxLength(400)
        )
        .addStringOption((option) =>
            option
                .setName('duration')
                .setDescription('How long until you should be reminded.')
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName('repeating')
                .setDescription('Whether this reminder should repeat until deleted.')
        ),

    async execute(interaction: ChatInputCommandInteraction, client: any) {
        const reminder = interaction.options.getString('reminder', true);
        const duration = interaction.options.getString('duration', true);
        const repeating = interaction.options.getBoolean('repeating') ?? false;

        const durationMs = ms(duration);
        if (!durationMs) {
            return { embeds: [EmbedGenerator.errorEmbed('Invalid duration.')], ephemeral: true };
        }

        const ends = Moment().add(durationMs);

        await client.expiringDocumentsManager?.reminders?.addNewDocument(
            await Reminders.create({
                user: interaction.user.id,
                reminder,
                repeating,
                duration: durationMs,
            })
        );

        return {
            embeds: [
                EmbedGenerator.basicEmbed(
                    `Reminder created.\nYou will be reminded in <t:${ends.unix()}:R>(<t:${ends.unix()}:f>)`
                ),
            ],
            ephemeral: true,
        };
    },
};
