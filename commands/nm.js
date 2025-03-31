const https = require('https');

module.exports = {
    name: 'nm',
    description: 'Decrypt content using the NM API',
    usage: 'nm [encrypted content]',
    async execute(api, event, args) {
        const encryptedContent = args.join(' ');

        if (!encryptedContent) {
            await api.sendMessage("Please provide encrypted content to decrypt.", event.threadID);
            return;
        }

        try {
            const encodedContent = encodeURIComponent(encryptedContent);
            const url = `https://api-nm.vercel.app/decrypt-latest?content=${encodedContent}`;

            const response = await makeRequest(url);

            if (typeof response === 'object') {
                const formattedResponse = JSON.stringify(response, null, 2);
                await api.sendMessage(`API Response:\n${formattedResponse}`, event.threadID);
            } else {
                await api.sendMessage(`Result: ${response}`, event.threadID);
            }
        } catch (error) {
            console.error('Error in nm command:', error);
            await api.sendMessage(`Error: ${error.message}`, event.threadID);
        }
    }
};

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } else {
                        resolve(data);
                    }
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}