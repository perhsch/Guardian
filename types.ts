import { Client, Collection } from 'discord.js';
import ExpiringDocumentManager from './Classes/ExpiringDocumentManager.ts';
import type { IInfraction } from './Schemas/Infractions.ts';
import type { IGiveaway } from './Schemas/Giveaways.ts';
import type { IReminder } from './Schemas/Reminders.ts';

export interface GuardianClient extends Client {
    commands: Collection<string, any>;
    subCommands: Collection<string, any>;
    expiringDocumentsManager: {
        infractions: ExpiringDocumentManager<IInfraction>;
        giveaways: ExpiringDocumentManager<IGiveaway>;
        reminders: ExpiringDocumentManager<IReminder>;
    };
}
