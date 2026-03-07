import { Collection } from 'discord.js';
import ExpiringDocumentManager from '../Classes/ExpiringDocumentManager';

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>;
        subCommands: Collection<string, any>;
        expiringDocumentsManager: {
            infractions: ExpiringDocumentManager<any>;
            giveaways: ExpiringDocumentManager<any>;
            reminders: ExpiringDocumentManager<any>;
        };
    }
}
