const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
    name: 'help',
    description: 'List all available commands',
    usage: 'help [command]',
    async execute(api, event, args) {
        try {
            const prefix = config.prefix || '!';
            let helpMessage = `📋 Available Commands:\n\n`;

            // Get the commands directory path
            const commandsDir = path.join(process.cwd(), 'commands');
            console.log(`Looking for commands in: ${commandsDir}`);

            // Get all command files
            const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
            console.log(`Found ${commandFiles.length} command files: ${commandFiles.join(', ')}`);

            // If specific command help is requested
            if (args.length > 0) {
                const commandName = args[0].toLowerCase();
                const commandPath = path.join(commandsDir, `${commandName}.js`);

                // Check if command file exists
                if (fs.existsSync(commandPath)) {
                    try {
                        // Clear require cache to ensure fresh loading
                        delete require.cache[require.resolve(commandPath)];

                        const command = require(commandPath);
                        helpMessage = `📌 Command: ${prefix}${command.name}\n`;

                        if (command.description) helpMessage += `📝 Description: ${command.description}\n`;
                        if (command.usage) helpMessage += `📋 Usage: ${prefix}${command.usage}\n`;

                        await api.sendMessage(helpMessage, event.threadID);
                    } catch (error) {
                        console.error(`Error loading command ${commandName} for help:`, error);
                        await api.sendMessage(`Sorry, there was an error retrieving help for ${commandName}.`, event.threadID);
                    }
                    return;
                } else {
                    helpMessage = `Command "${commandName}" not found. Here are the available commands:\n\n`;
                }
            }

            // List all commands
            for (const file of commandFiles) {
                try {
                    // Clear require cache to ensure fresh loading
                    const commandPath = path.join(commandsDir, file);
                    delete require.cache[require.resolve(commandPath)];

                    const command = require(commandPath);
                    helpMessage += `${prefix}${command.name} - ${command.description || 'No description'}\n`;
                } catch (error) {
                    console.error(`Failed to load command ${file} for help listing:`, error);
                }
            }

            helpMessage += `\nType ${prefix}help [command] for more info about a specific command.`;
            await api.sendMessage(helpMessage, event.threadID);
        } catch (error) {
            console.error('Error in help command:', error);
            await api.sendMessage('There was an error processing the help command.', event.threadID);
        }
    }
};