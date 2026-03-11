import { SlashCommandSubcommandBuilder } from 'discord.js';
// @ts-expect-error The ascii-table package has no type declarations, but still works.
import ascii from 'ascii-table';
import { loadFiles } from '../Functions/fileLoader.ts';
import { GuardianClient } from '../types.ts';

/**
 * @param {GuardianClient} client
 */
export async function loadCommands(client: GuardianClient): Promise<void> {
    const table = new ascii().setHeading('Commands', 'Status');
    const files = await loadFiles('Commands');
    let commandsArray: any[] = [];

    await client.commands.clear();
    await client.subCommands.clear();

    for (const file of files) {
        const command = (await import(`file://${file}`)).default;

        const categoryMatch = file.match(/[/\\]Commands[/\\](.*?)[/\\]/);
        const category = categoryMatch && categoryMatch[1] ? categoryMatch[1].toLowerCase() : 'unknown';
        command.category = category;

        if (command.subCommands) {
            for (const subcommand of command.subCommands) {
                client.subCommands.set(`${command.data.name}.${subcommand.data.name}`, subcommand);
            }
        }

        if (command.data instanceof SlashCommandSubcommandBuilder) continue;

        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());

        table.addRow(command.data.name, '✅');
    }

    try {
        if (client.application) {
            await client.application.commands.set(commandsArray);
        }
    } catch (error: any) {
        console.error('Error setting commands:');
        console.error('Last processed command:', commandsArray[commandsArray.length - 1]);
        if (error.code === 50035) {
            console.error('Discord API Error: Invalid Form Body - Description too long');
            console.error('Check command descriptions and option descriptions (max 130 chars)');

            // Check each option description length
            const lastCommand = commandsArray[commandsArray.length - 1];
            if (lastCommand) {
                // Check main command description
                if (lastCommand.description && lastCommand.description.length > 130) {
                    console.error(`Main command description: "${lastCommand.description}" (${lastCommand.description.length} chars) - TOO LONG`);
                } else if (lastCommand.description) {
                    console.error(`Main command description: "${lastCommand.description}" (${lastCommand.description.length} chars) - OK`);
                }

                // Check option descriptions
                if (lastCommand.options) {
                    console.error('Checking option descriptions:');
                    lastCommand.options.forEach((opt: any, index: number) => {
                        if (opt.description && opt.description.length > 130) {
                            console.error(`Option ${index} "${opt.name}": "${opt.description}" (${opt.description.length} chars) - TOO LONG`);
                        } else if (opt.description) {
                            console.error(`Option ${index} "${opt.name}": "${opt.description}" (${opt.description.length} chars) - OK`);
                        }
                    });
                }
            }
        }
        throw error;
    }

    console.log(table.toString(), '\nCommands Loaded.');
}
