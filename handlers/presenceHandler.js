/**
 * Handle presence events (when users come online/offline)
 * @param {Object} api - The API object from ws3-fca
 * @param {Object} event - The presence event
 */
function handlePresence(api, event) {
    try {
        const userID = event.userID;
        const presence = event.statuses;

        // Just log presence changes, don't respond to them
        console.log(`User ${userID} is now ${JSON.stringify(presence)}`);
    } catch (error) {
        console.error('Error in presenceHandler:', error);
    }
}

module.exports = {
    handlePresence
};