const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Handle reaction events
 * @param {Object} api - The API object from ws3-fca
 * @param {Object} event - The reaction event
 */
async function handleReaction(api, event) {
    try {
        // Add delay before responding to reactions to seem more human-like
        await delay(Math.floor(Math.random() * 1000) + 500);

        const reaction = event.reaction;
        const userID = event.userID;

        console.log(`Reaction received: ${reaction} from ${userID}`);

        // Only respond to reactions sometimes (30% chance) to seem more human-like
        if (Math.random() < 0.3) {
            await api.sendMessage(`I noticed you reacted with: ${reaction}`, event.threadID);
        }
    } catch (error) {
        console.error('Error in reactionHandler:', error);
    }
}

module.exports = {
    handleReaction
};