const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Collection to store commands
const commands = new Map();

// Load all command files
function loadCommands() {
    try {
        // Get the commands directory path
        const commandsDir = path.join(process.cwd(), 'commands');

        // Check if commands directory exists
        if (!fs.existsSync(commandsDir)) {
            console.error(`Commands directory does not exist at: ${commandsDir}`);
            console.error("Creating commands directory...");
            fs.mkdirSync(commandsDir, { recursive: true });
            return;
        }

        // Print directory contents for debugging
        console.log(`Contents of commands directory (${commandsDir}):`, fs.readdirSync(commandsDir));

        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

        if (commandFiles.length === 0) {
            console.error(`No command files found in ${commandsDir} directory!`);
            return;
        }

        for (const file of commandFiles) {
            try {
                // Clear require cache to ensure fresh loading
                const commandPath = path.join(commandsDir, file);
                delete require.cache[require.resolve(commandPath)];

                const command = require(commandPath);

                // Validate command structure
                if (!command.name) {
                    console.error(`Command in ${file} has no name property!`);
                    continue;
                }

                if (!command.execute || typeof command.execute !== 'function') {
                    console.error(`Command "${command.name}" has no execute function!`);
                    continue;
                }

                commands.set(command.name, command);
                console.log(`✓ Loaded command: ${command.name}`);
            } catch (error) {
                console.error(`Failed to load command from file ${file}:`, error);
            }
        }

        console.log(`✓ Loaded ${commands.size} commands: ${Array.from(commands.keys()).join(', ')}`);
    } catch (error) {
        console.error("Failed to load commands:", error);
    }
}

// Initialize by loading commands
loadCommands();

/**
 * Handle incoming message events
 * @param {Object} api - The API object from ws3-fca
 * @param {Object} event - The message event
 */
async function handleMessage(api, event) {
    try {
        const message = event.body;
        const senderId = event.senderID;

        if (!message) return;

        // Log incoming message for debugging
        console.log(`Received message from ${senderId}: ${message}`);

        // Check if commands are loaded, if not try loading again
        if (commands.size === 0) {
            console.log("No commands loaded, attempting to load commands again...");
            loadCommands();

            // If still no commands, send an error message
            if (commands.size === 0) {
                await api.sendMessage("Bot is experiencing issues loading commands. Please try again later.", event.threadID);
                return;
            }
        }

        // Add human-like behavior with typing indicator - with safety check
        if (config.typingIndicator && event.threadID) {
            try {
                api.sendTypingIndicator(event.threadID);

                // Simulate human typing based on message length
                const typingDelay = Math.min(message.length * 30, 2000) + Math.floor(Math.random() * 1000);
                await delay(typingDelay);
            } catch (err) {
                console.log("Error sending typing indicator:", err.message);
                // Continue processing even if typing indicator fails
            }
        }

        // Get prefix from config
        const prefix = config.prefix;
        console.log(`Using prefix: "${prefix}"`);
        console.log(`Available commands: ${Array.from(commands.keys()).join(', ')}`);

        let args;
        let commandName;

        // Handle commands differently based on whether a prefix is configured
        if (prefix === "") {
            // No prefix mode: the first word is the command
            args = message.trim().split(/ +/);
            commandName = args.shift().toLowerCase();
        } else {
            // Prefix mode: check if message starts with prefix
            if (!message.startsWith(prefix)) {
                console.log(`Message does not start with prefix "${prefix}": ${message}`);
                return; // Exit if message doesn't start with prefix
            }
            args = message.slice(prefix.length).trim().split(/ +/);
            commandName = args.shift().toLowerCase();
        }

        console.log(`Command detected: "${commandName}" with args: ${args.join(', ')}`);

        // Check if command exists
        if (commands.has(commandName)) {
            console.log(`Executing command: ${commandName}`);
            try {
                await commands.get(commandName).execute(api, event, args);
                console.log(`Command ${commandName} executed successfully`);
            } catch (error) {
                console.error(`Error executing command '${commandName}':`, error);
                if (event.threadID) {
                    await api.sendMessage(`There was an error executing that command.`, event.threadID);
                }
            }
        } else {
            console.log(`Command not found: ${commandName}`);
            // Only send "unknown command" message if a prefix is configured or if in direct message
            if (prefix !== "" || event.threadID === event.senderID) {
                await api.sendMessage(
                    `Unknown command: ${commandName}. Type ${prefix}help for a list of commands.`,
                    event.threadID
                );
            }
        }
    } catch (error) {
        console.error('Error in messageHandler:', error);
    }
}

module.exports = {
    handleMessage,
    loadCommands
};