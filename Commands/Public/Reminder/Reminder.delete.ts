import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../../Functions/embedGenerator.ts';
import Reminders from '../../../Schemas/Reminders.ts';

export default {
    enabled: true,
    data: new SlashCommandSubcommandBuilder()
        .setName('delete')
        .setDescription('Delete a reminder.')
        .addStringOption((option) =>
            option
                .setName('reminder')
                .setDescription("The reminder you'd like to remove, alternatively \"all\".")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        const reminderArg = interaction.options.getString('reminder', true);

        if (reminderArg === 'all') {
            await Reminders.deleteMany({ user: interaction.user.id });
            return { embeds: [EmbedGenerator.basicEmbed('All reminders deleted.')], ephemeral: true };
        }

        const reminders = await Reminders.find({ user: interaction.user.id }).sort({ expires: 1 });
        if (reminders.length === 0) {
            return { embeds: [EmbedGenerator.errorEmbed('No reminders found.')], ephemeral: true };
        }

        const index = parseInt(reminderArg, 10);
        if (isNaN(index) || !reminders[index - 1]) {
            return { embeds: [EmbedGenerator.errorEmbed('Reminder not found.')], ephemeral: true };
        }

        await reminders[index - 1]!.deleteOne();

        return { embeds: [EmbedGenerator.basicEmbed('Reminder deleted.')], ephemeral: true };
    },
};
