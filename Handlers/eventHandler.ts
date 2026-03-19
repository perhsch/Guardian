import { Client } from 'discord.js';
import { loadFiles } from '../Functions/fileLoader.ts';
import { pathToFileURL } from 'url';

export async function loadEvents(client: Client) {
    console.log('Loading events...');
    const files = await loadFiles('Events');
    let successCount = 0;
    let errorCount = 0;

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

            successCount++;
        } catch (error) {
            console.error(`Error loading event ${file}:`, error);
            errorCount++;
        }
    }

    console.log(`Events loaded: ${successCount} success, ${errorCount} failed`);
}
