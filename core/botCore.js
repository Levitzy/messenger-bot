const login = require("ws3-fca");
const fs = require("fs");
const path = require("path");
const config = require("../config.json");
const { loadAppState, saveAppState } = require("../utils/appState");
const { delay } = require("../utils/botUtils");

// Track the bot instance
let botInstance = null;

/**
 * Start the bot with Facebook login and event listeners
 * @returns {Promise<Object>} Bot instance
 */
async function startBot() {
    // If bot is already running, return existing instance
    if (botInstance) {
        console.log("Bot is already running, returning existing instance");
        return botInstance;
    }

    try {
        console.log("Starting bot...");

        // Ensure all required directories exist
        const dirs = ['./commands', './core', './handlers', './utils'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });

        // Load handlers
        let messageHandler, reactionHandler, presenceHandler;
        try {
            // Dynamic imports to avoid circular dependencies
            messageHandler = require("../handlers/messageHandler");
            reactionHandler = require("../handlers/reactionHandler");
            presenceHandler = require("../handlers/presenceHandler");

            console.log("Handlers loaded successfully");
        } catch (error) {
            console.error("Error loading handlers:", error);
            throw new Error(`Failed to load required handlers: ${error.message}`);
        }

        // Load AppState from file
        const appState = loadAppState();

        // Set bot options based on config
        const option = {
            logLevel: config.logLevel || "silent",
            forceLogin: false,
            listenEvents: true,
            updatePresence: false,
            selfListen: false,
            autoMarkRead: config.autoMarkRead || false,
            autoReconnect: true,
            userAgent: config.userAgent,
            online: true,
            emitReady: true
        };

        // Anti-detection delay before login
        console.log("Starting bot with anti-detection measures...");
        await delay(Math.floor(Math.random() * 1000) + 500); // Reduced delay for faster startup

        return new Promise((resolve, reject) => {
            try {
                login({ appState }, option, async (err, api) => {
                    if (err) {
                        console.error("Login error:", err);

                        // If the error suggests verification is needed
                        if (err.toString().includes("checkpoint") || err.toString().includes("login approval")) {
                            console.error("Account needs verification. Please check your Facebook account and try again.");
                            reject(new Error("Account needs verification"));
                            return;
                        }
                        reject(err);
                        return;
                    }

                    // Save the updated AppState after login
                    if (config.autoSaveState) {
                        saveAppState(api.getAppState());
                    }

                    // Configure API options
                    api.setOptions({
                        listenEvents: true,
                        logLevel: config.logLevel || "silent",
                        updatePresence: false,
                        selfListen: false
                    });

                    console.log("Bot successfully connected!");
                    console.log(`Logged in as ID: ${api.getCurrentUserID()}`);

                    // Set the bot instance globally
                    botInstance = api;

                    // Create a heartbeat to keep the connection alive
                    const heartbeatInterval = setInterval(() => {
                        if (botInstance) {
                            console.log("Sending heartbeat to keep connection alive...");
                            // Use a harmless API call to keep the connection active
                            botInstance.getThreadList(1, null, [])
                                .catch(err => {
                                    console.error("Heartbeat error:", err);

                                    // If serious error, try reconnecting
                                    if (err.toString().includes("Connection closed")) {
                                        console.log("Connection closed, attempting to reconnect...");
                                        clearInterval(heartbeatInterval);
                                        botInstance = null;
                                        startBot().catch(console.error);
                                    }
                                });
                        } else {
                            clearInterval(heartbeatInterval);
                        }
                    }, 60000); // Every minute

                    // Resolve the promise with the API
                    resolve(api);

                    // Start listening for events
                    api.listen(async (err, event) => {
                        if (err) {
                            console.error("Listen error:", err);
                            return;
                        }

                        // Make sure the event object contains expected properties
                        if (!event || !event.type) {
                            console.error("Invalid event received:", event);
                            return;
                        }

                        // Process different event types using the appropriate handlers
                        try {
                            switch (event.type) {
                                case "message":
                                    if (event.threadID && event.body) {
                                        await messageHandler.handleMessage(api, event);
                                    } else {
                                        console.log("Skipping message with missing properties:", event);
                                    }
                                    break;
                                case "message_reaction":
                                    if (event.threadID) {
                                        await reactionHandler.handleReaction(api, event);
                                    }
                                    break;
                                case "presence":
                                    presenceHandler.handlePresence(api, event);
                                    break;
                            }
                        } catch (error) {
                            console.error("Error handling event:", error);
                        }

                        // Periodically save the updated AppState
                        if (config.autoSaveState && Math.random() < 0.05) { // 5% chance to save on each event
                            saveAppState(api.getAppState());
                        }
                    });
                });
            } catch (error) {
                console.error("Login wrapper error:", error);
                reject(error);
            }
        });
    } catch (error) {
        console.error("Fatal error:", error);
        throw error;
    }
}

/**
 * Stop the running bot
 */
function stopBot() {
    if (botInstance) {
        console.log("Stopping bot...");
        botInstance.logout();
        botInstance = null;
        console.log("Bot stopped");
    } else {
        console.log("No bot instance to stop");
    }
}

/**
 * Check if the bot is running
 * @returns {boolean} True if the bot is running
 */
function isBotRunning() {
    return botInstance !== null;
}

/**
 * Get the bot instance if it exists
 * @returns {Object|null} The bot instance or null
 */
function getBotInstance() {
    return botInstance;
}

module.exports = {
    startBot,
    stopBot,
    isBotRunning,
    getBotInstance
};