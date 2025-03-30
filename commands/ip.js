const https = require('https');

module.exports = {
    name: 'ip',
    description: 'Get IP address information using jsonip.com',
    usage: 'ip',
    async execute(api, event, args) {
        try {
            const ipInfo = await getIpInfo();

            const message = `📡 IP Information 📡\n\nIP Address: ${ipInfo.ip}`;

            await api.sendMessage(message, event.threadID);
        } catch (error) {
            console.error('Error fetching IP information:', error);
            await api.sendMessage('An error occurred while fetching IP information. Please try again later.', event.threadID);
        }
    }
};

function getIpInfo() {
    return new Promise((resolve, reject) => {
        const req = https.get('https://jsonip.com', (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const ipInfo = JSON.parse(data);
                    resolve(ipInfo);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}