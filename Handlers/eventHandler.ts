// @ts-expect-error The ascii-table package has no type declarations, but still works.
import ascii from 'ascii-table';
import { Client } from 'discord.js';
import { loadFiles } from '../Functions/fileLoader.ts';
import { pathToFileURL } from 'url';

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

function getEventEmoji(fileName: string): string {
    if (fileName.includes('ready')) return '🚀';
    if (fileName.includes('message')) return '💬';
    if (fileName.includes('guild')) return '🏰';
    if (fileName.includes('interaction')) return '⚡';
    if (fileName.includes('voice')) return '🎤';
    if (fileName.includes('reaction')) return '😀';
    if (fileName.includes('channel')) return '📢';
    if (fileName.includes('member')) return '👤';
    if (fileName.includes('role')) return '🎭';
    if (fileName.includes('emoji')) return '😊';
    if (fileName.includes('invite')) return '📨';
    if (fileName.includes('thread')) return '🧵';
    return '📋';
}

export async function loadEvents(client: Client) {
    console.log();
    createHeader('EVENT LOADER', '🎯');

    const table = createStyledTable(['Event', 'Type', 'Status']);
    const files = await loadFiles('Events');
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
        try {
            const eventModule = await import(pathToFileURL(file).href);
            const event = eventModule.default || eventModule;
            const execute = (...args: any[]) => event.execute(...args, client);

            const fileName = file.split(/[/\\]/).pop() || 'unknown';
            const eventName = event.name || fileName.replace('.js', '').replace('.ts', '');
            const eventType = event.rest ? 'REST' : event.once ? 'ONCE' : 'REPEATING';
            const eventEmoji = getEventEmoji(fileName.toLowerCase());

            if (event.rest) {
                if (event.once) {
                    client.rest.once(event.name, execute);
                } else {
                    client.rest.on(event.name, execute);
                }
            } else {
                if (event.once) {
                    client.once(event.name, execute);
                } else {
                    client.on(event.name, execute);
                }
            }

            table.addRow(`${eventEmoji} ${eventName}`, eventType, '✅');
            successCount++;
        } catch (error) {
            console.error(`Error loading event ${file}:`, error);
            const fileName = file.split(/[/\\]/).pop() || 'unknown';
            table.addRow(fileName, 'ERROR', '❌');
            errorCount++;
        }
    }

    console.log(table.toString());
    createSeparator();

    const total = successCount + errorCount;
    const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : '0';

    styledLog(
        `✅ ${successCount} loaded │ ❌ ${errorCount} failed │ 📊 ${successRate}% │ 🎯 ${successCount} events`,
        '\x1b[36m'
    );

    if (errorCount === 0) {
        styledLog('🎉 All events loaded! ⚡ Ready!', '\x1b[92m');
    } else {
        styledLog(`⚠️  ${errorCount} failed`, '\x1b[93m');
    }
}
