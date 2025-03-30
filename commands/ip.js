module.exports = {
    name: 'ip',
    description: 'Check your public IP or ping an IP address',
    usage: 'ip [ipAddress]',
    async execute(api, event, args) {
        const https = require('https');
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            if (args.length === 0) {
                await api.sendMessage("Fetching your public IP address...", event.threadID);

                const publicIP = await getPublicIP();
                await api.sendMessage(`Your public IP address is: ${publicIP}`, event.threadID);
            } else {
                const ipToPing = args[0];

                await api.sendMessage(`Pinging ${ipToPing}...`, event.threadID);

                const pingResult = await pingIP(ipToPing);
                await api.sendMessage(pingResult, event.threadID);
            }
        } catch (error) {
            console.error("Error in IP command:", error);
            await api.sendMessage(`Error: ${error.message}`, event.threadID);
        }

        async function getPublicIP() {
            return new Promise((resolve, reject) => {
                https.get('https://api.ipify.org', (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        resolve(data.trim());
                    });
                }).on('error', (err) => {
                    reject(new Error(`Failed to get public IP: ${err.message}`));
                });
            });
        }

        async function pingIP(ip) {
            try {
                const pingCommand = process.platform === 'win32'
                    ? `ping -n 4 ${ip}`
                    : `ping -c 4 ${ip}`;

                const { stdout } = await execAsync(pingCommand);
                return `Ping results for ${ip}:\n${stdout}`;
            } catch (error) {
                throw new Error(`Failed to ping ${ip}: ${error.message}`);
            }
        }
    }
};