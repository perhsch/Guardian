const fs = require('fs');
const path = require('path');

const maintenancePath = path.join(__dirname, '../Config/maintenance.json');

/**
 * Get whether maintenance mode is enabled.
 * @returns {boolean}
 */
function getMaintenanceEnabled() {
    try {
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
function setMaintenanceEnabled(enabled) {
    const data = { enabled: !!enabled };
    fs.writeFileSync(maintenancePath, JSON.stringify(data, null, 4), 'utf8');
}

module.exports = {
    getMaintenanceEnabled,
    setMaintenanceEnabled,
};
