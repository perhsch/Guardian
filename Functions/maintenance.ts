import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const maintenancePath = path.join(__dirname, '../Config/maintenance.json');

/**
 * Get whether maintenance mode is enabled.
 * @returns {boolean}
 */
export function getMaintenanceEnabled(): boolean {
    try {
        if (!fs.existsSync(maintenancePath)) return false;
        const data = JSON.parse(fs.readFileSync(maintenancePath, 'utf8'));
        return data.enabled === true;
    } catch {
        return false;
    }
}

/**
 * Set whether maintenance mode is enabled.
 * @param {boolean} enabled
 */
export function setMaintenanceEnabled(enabled: boolean): void {
    const data = { enabled: !!enabled };
    fs.writeFileSync(maintenancePath, JSON.stringify(data, null, 4), 'utf8');
}
