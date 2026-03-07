import { SlashCommandBuilder } from 'discord.js';
import ReminderCreate from './Reminder.create.ts';
import ReminderList from './Reminder.list.ts';
import ReminderDelete from './Reminder.delete.ts';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Reminder system.')
        .setDMPermission(false)
        .addSubcommand(ReminderCreate.data)
        .addSubcommand(ReminderList.data)
        .addSubcommand(ReminderDelete.data),
    subCommands: [ReminderCreate, ReminderList, ReminderDelete],
};
