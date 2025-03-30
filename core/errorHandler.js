/**
 * Setup process event handlers for the bot
 */
function setupErrorHandlers() {
    // Handle clean shutdown
    process.on('SIGINT', () => {
        console.log("Bot is shutting down...");
        process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error("Uncaught exception:", err);
        // Don't exit, try to continue running
    });
}

module.exports = {
    setupErrorHandlers
};