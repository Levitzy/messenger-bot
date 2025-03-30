module.exports = {
    name: 'ip',
    description: 'Check your IP or get details about an IP address',
    usage: 'ip [ipAddress]',
    async execute(api, event, args) {
        const https = require('https');

        try {
            await api.sendMessage("Fetching IP information...", event.threadID);

            if (args.length === 0) {
                // Get user's IP using jsonip.com
                const ipData = await getJsonIP();
                const ipInfo = await getIPInfo(ipData.ip);
                await api.sendMessage(formatIPInfo(ipInfo), event.threadID);
            } else {
                const ipToCheck = args[0];
                const ipInfo = await getIPInfo(ipToCheck);
                await api.sendMessage(formatIPInfo(ipInfo), event.threadID);
            }
        } catch (error) {
            console.error("Error in IP command:", error);
            await api.sendMessage(`Error: ${error.message}`, event.threadID);
        }

        async function getJsonIP() {
            return new Promise((resolve, reject) => {
                https.get('https://jsonip.com', (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const ipData = JSON.parse(data);
                            resolve(ipData);
                        } catch (error) {
                            reject(new Error(`Failed to parse IP data: ${error.message}`));
                        }
                    });
                }).on('error', (err) => {
                    reject(new Error(`Failed to get IP: ${err.message}`));
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