const fs = require("fs");

/**
 * Load the Facebook AppState from a file
 * @returns {Object} The parsed AppState object
 */
function loadAppState() {
    try {
        const appState = JSON.parse(fs.readFileSync('./appstate.json', 'utf8'));
        console.log("AppState loaded successfully");
        return appState;
    } catch (error) {
        console.error('Error loading AppState:', error);
        throw new Error('Failed to load AppState. Make sure appstate.json exists and is valid.');
    }
}

/**
 * Save the Facebook AppState to a file
 * @param {Object} appState - The AppState object to save
 */
function saveAppState(appState) {
    try {
        fs.writeFileSync('./appstate.json', JSON.stringify(appState, null, 4));
        console.log("AppState saved successfully");
    } catch (error) {
        console.error('Error saving AppState:', error);
    }
}

module.exports = {
    loadAppState,
    saveAppState
};