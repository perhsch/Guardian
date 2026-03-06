import Discord from 'discord.js';
// @ts-expect-error The ascii-table package has no type declarations, but still works.
import ascii from 'ascii-table';
import { loadFiles } from '../Functions/fileLoader.ts';
import { GuardianClient } from '../types.ts';

/**
 * @param {Discord.Client} client
 */
export async function loadCommands(client: GuardianClient): Promise<void> {
    const table = new ascii().setHeading('Commands', 'Status');
    const files = await loadFiles('Commands');
    let commandsArray: any[] = [];

    await client.commands.clear();
    await client.subCommands.clear();

    for (const file of files) {
        const command = (await import(`file://${file}`)).default;

        const categoryMatch = file.match(/[\\/]Commands[\\/](.*?)[\\/]/);
        const category = categoryMatch ? categoryMatch[1].toLowerCase() : 'unknown';
        command.category = category;

        if (command.subCommands) {
            for (const subcommand of command.subCommands) {
                client.subCommands.set(`${command.data.name}.${subcommand.data.name}`, subcommand);
            }
        }
        
        if (command.data instanceof Discord.SlashCommandSubcommandBuilder) continue;

        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());

        table.addRow(command.data.name, '✅');
    }

    await client.application.commands.set(commandsArray);

    console.log(table.toString(), '\nCommands Loaded.');
}
