module.exports = {
    name: 'ip',
    description: 'Check your public IP or get details about an IP address',
    usage: 'ip [ipAddress]',
    async execute(api, event, args) {
        const https = require('https');

        try {
            if (args.length === 0) {
                await api.sendMessage("Fetching your public IP address...", event.threadID);

                const publicIP = await getPublicIP();
                await api.sendMessage(`Your public IP address is: ${publicIP}`, event.threadID);

                // Get additional info about user's IP
                const ipInfo = await getIPInfo(publicIP);
                await api.sendMessage(formatIPInfo(ipInfo), event.threadID);
            } else {
                const ipToCheck = args[0];

                await api.sendMessage(`Fetching information for IP: ${ipToCheck}...`, event.threadID);

                const ipInfo = await getIPInfo(ipToCheck);
                await api.sendMessage(formatIPInfo(ipInfo), event.threadID);
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

        async function getIPInfo(ip) {
            return new Promise((resolve, reject) => {
                https.get(`https://ipapi.co/${ip}/json/`, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const ipInfo = JSON.parse(data);

                            if (ipInfo.error) {
                                reject(new Error(ipInfo.reason || 'Invalid IP address'));
                                return;
                            }

                            resolve(ipInfo);
                        } catch (error) {
                            reject(new Error(`Failed to parse IP info: ${error.message}`));
                        }
                    });
                }).on('error', (err) => {
                    reject(new Error(`Failed to get IP info: ${err.message}`));
                });
            });
        }

        function formatIPInfo(ipInfo) {
            return `📍 IP Information 📍
╔══════════════════════════
║ IP: ${ipInfo.ip}
║ Location: ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country_name}
║ Coordinates: ${ipInfo.latitude}, ${ipInfo.longitude}
║ Timezone: ${ipInfo.timezone} (UTC ${ipInfo.utc_offset})
║ ISP: ${ipInfo.org}
║ 
║ Country: ${ipInfo.country_name} (${ipInfo.country_code})
║ Currency: ${ipInfo.currency_name} (${ipInfo.currency})
║ Languages: ${ipInfo.languages}
╚══════════════════════════`;
        }
    }
};