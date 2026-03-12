import { SlashCommandSubcommandBuilder } from 'discord.js';
// @ts-expect-error The ascii-table package has no type declarations, but still works.
import ascii from 'ascii-table';
import { loadFiles } from '../Functions/fileLoader.ts';
import { GuardianClient } from '../types.ts';

function createStyledTable(headings: string[]): ascii.Table {
    const table = new ascii()
        .setHeading(...headings)
        .setBorder('│', '─', '┼', '└', '┘', '┐', '┌')
        .setAlign(0, ascii.LEFT)
        .setAlign(1, ascii.LEFT)
        .setAlign(2, ascii.CENTER);

    return table;
}

function styledLog(message: string, color: string = '\x1b[36m'): void {
    console.log(`${color}${message}\x1b[0m`);
}

function createHeader(title: string, icon: string): void {
    styledLog(`┌─ ${icon} ${title} ─┐`, '\x1b[94m');
}

function createSeparator(): void {
    styledLog('├─────────────────────┤', '\x1b[96m');
}

export async function loadCommands(client: GuardianClient): Promise<void> {
    console.log();
    createHeader('COMMAND LOADER', '⚡');

    const table = createStyledTable(['Command', 'Category', 'Status']);
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

            const categoryEmoji = getCategoryEmoji(category);
            table.addRow(`${command.data.name}`, `${categoryEmoji}${category}`, '✅');
            successCount++;
        } catch (error) {
            console.error(`Error loading command ${file}:`, error);
            const fileName = file.split(/[/\\]/).pop() || 'unknown';
            table.addRow(fileName, '❌', '❌');
            errorCount++;
        }
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

            const lastCommand = commandsArray[commandsArray.length - 1];
            if (lastCommand) {
                if (lastCommand.description && lastCommand.description.length > 130) {
                    console.error(
                        `Main command description: "${lastCommand.description}" (${lastCommand.description.length} chars) - TOO LONG`
                    );
                } else if (lastCommand.description) {
                    console.error(
                        `Main command description: "${lastCommand.description}" (${lastCommand.description.length} chars) - OK`
                    );
                }

                if (lastCommand.options) {
                    console.error('Checking option descriptions:');
                    lastCommand.options.forEach((opt: any, index: number) => {
                        if (opt.description && opt.description.length > 130) {
                            console.error(
                                `Option ${index} "${opt.name}": "${opt.description}" (${opt.description.length} chars) - TOO LONG`
                            );
                        } else if (opt.description) {
                            console.error(
                                `Option ${index} "${opt.name}": "${opt.description}" (${opt.description.length} chars) - OK`
                            );
                        }
                    });
                }
            }
        }
        throw error;
    }

    console.log(table.toString());
    createSeparator();

    const total = successCount + errorCount;
    const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : '0';

    styledLog(
        `✅ ${successCount} loaded │ ❌ ${errorCount} failed │ 📊 ${successRate}% │ 🎯 ${client.commands.size} cmds │ 🔧 ${client.subCommands.size} subcmds`,
        '\x1b[36m'
    );

    if (errorCount === 0) {
        styledLog('🎉 All commands loaded!', '\x1b[92m');
    } else {
        styledLog(`⚠️  ${errorCount} failed`, '\x1b[93m');
    }
}

function getCategoryEmoji(category: string): string {
    const emojis: { [key: string]: string } = {
        administrator: '👑',
        moderator: '🛡️',
        information: 'ℹ️',
        utility: '🔧',
        fun: '🎮',
        developer: '👨‍💻',
        music: '🎵',
        economy: '💰',
        giveaway: '🎉',
        setup: '⚙️',
        unknown: '❓',
    };
    return emojis[category] || '📁';
}
