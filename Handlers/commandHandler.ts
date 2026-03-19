import { SlashCommandSubcommandBuilder } from 'discord.js';
import { loadFiles } from '../Functions/fileLoader.ts';
import { GuardianClient } from '../types.ts';

export async function loadCommands(client: GuardianClient): Promise<void> {
    console.log('Loading commands...');
    const files = await loadFiles('Commands');
    let commandsArray: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    await client.commands.clear();
    await client.subCommands.clear();

    for (const file of files) {
        try {
            const command = (await import(`file://${file}`)).default;

            const categoryMatch = file.match(/[/\\]Commands[/\\](.*?)[/\\]/);
            const category =
                categoryMatch && categoryMatch[1] ? categoryMatch[1].toLowerCase() : 'unknown';
            command.category = category;

            if (command.subCommands) {
                for (const subcommand of command.subCommands) {
                    client.subCommands.set(
                        `${command.data.name}.${subcommand.data.name}`,
                        subcommand
                    );
                }
            }

            if (command.data instanceof SlashCommandSubcommandBuilder) continue;

            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON());

            successCount++;
        } catch (error) {
            console.error(`Error loading command ${file}:`, error);
            errorCount++;
        }
    }

    try {
        if (client.application) {
            await client.application.commands.set(commandsArray);
        }
    } catch (error: any) {
        console.error('Error setting commands:', error);
        throw error;
    }

    console.log(`Commands loaded: ${successCount} success, ${errorCount} failed`);
}

