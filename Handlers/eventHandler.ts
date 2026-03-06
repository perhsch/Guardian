// @ts-ignore
import ascii from 'ascii-table';
import { Client } from 'discord.js';
import { loadFiles } from '../Functions/fileLoader.ts';
import { pathToFileURL } from 'url';

export async function loadEvents(client: Client) {
    const table = new ascii().setHeading('Events', 'Status');
    const files = await loadFiles('Events');

    for (const file of files) {
        try {
            const eventModule = await import(pathToFileURL(file).href);
            const event = eventModule.default || eventModule;
            const execute = (...args: any[]) => event.execute(...args, client);

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

            table.addRow(file.split('/').pop(), '✅');
        } catch (error) {
            console.error(`Error loading event ${file}:`, error);
            table.addRow(file.split('/').pop(), '❌');
        }
    }

    console.log(table.toString(), '\nLoaded Events.');
}
