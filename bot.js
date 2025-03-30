const { startBot, isBotRunning, getBotInstance } = require("./core/botCore");
const { setupErrorHandlers } = require("./core/errorHandler");
const { delay } = require("./utils/botUtils");
const path = require("path");
const config = require("./config.json");

// Try to load Express, but don't crash if it's not installed
let express, http, app, server;
try {
    express = require("express");
    http = require("http");
} catch (error) {
    console.log("Express not installed. Web server will not be available.");
    console.log("To enable the web server, run: npm install express");
}

setupErrorHandlers();

// Only set up Express server if Express is installed
if (express) {
    app = express();
    const PORT = process.env.PORT || 3000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const authenticateRequest = (req, res, next) => {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        next();
    };

    app.get("/", (req, res) => {
        res.send(`
        <html>
            <head>
                <title>${config.botName} - Status Dashboard</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .status { padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; font-weight: bold; }
                    .online { background-color: #d4edda; color: #155724; }
                    .offline { background-color: #f8d7da; color: #721c24; }
                    .header { display: flex; justify-content: space-between; align-items: center; }
                    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
                    .stat-card { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${config.botName} Dashboard</h1>
                        <span>Server Time: ${new Date().toLocaleString()}</span>
                    </div>
                    <div class="status ${isBotRunning() ? 'online' : 'offline'}">
                        Bot is currently ${isBotRunning() ? 'ONLINE' : 'OFFLINE'}
                    </div>
                    <div class="stats">
                        <div class="stat-card">
                            <h3>Server Uptime</h3>
                            <p>${formatUptime(process.uptime())}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Bot Status</h3>
                            <p>${isBotRunning() ? 'Running' : 'Stopped'}</p>
                        </div>
                    </div>
                </div>
                <script>
                    setTimeout(() => {
                        window.location.reload();
                    }, 30000);
                </script>
            </body>
        </html>
    `);
    });

    app.get("/api/status", authenticateRequest, (req, res) => {
        res.json({
            bot: {
                status: isBotRunning() ? "online" : "offline",
                uptime: process.uptime()
            },
            server: {
                timestamp: new Date(),
                uptime: process.uptime()
            }
        });
    });

    app.post("/api/bot/restart", authenticateRequest, async (req, res) => {
        try {
            if (isBotRunning()) {
                const { stopBot } = require("./core/botCore");
                if (typeof stopBot === 'function') {
                    stopBot();
                    await delay(2000);
                }
            }

            await startBot();
            res.json({ success: true, message: "Bot restarted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        result += `${secs}s`;

        return result;
    }

    server = http.createServer(app);

    // Add a basic ping endpoint for testing connectivity
    app.get('/ping', (req, res) => {
        res.send('pong');
    });

    // Get network interfaces for better logging
    const networkInterfaces = require('os').networkInterfaces();

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`\n=== SERVER INFORMATION ===`);
        console.log(`Server running on 0.0.0.0:${PORT}`);
        console.log(`Access the dashboard using one of these URLs:`);
        console.log(`• Local: http://localhost:${PORT}`);
        console.log(`• Local IP:`);

        // List all possible IP addresses
        Object.keys(networkInterfaces).forEach(interfaceName => {
            networkInterfaces[interfaceName].forEach(iface => {
                // Skip internal and non-IPv4 addresses
                if (!iface.internal && iface.family === 'IPv4') {
                    console.log(`  - http://${iface.address}:${PORT}`);
                }
            });
        });
        console.log(`\nTroubleshooting tips:`);
        console.log(`• Ensure no firewall is blocking port ${PORT}`);
        console.log(`• Try the /ping endpoint (e.g., http://localhost:${PORT}/ping)`);
        console.log(`=========================\n`);
    });
}

(async () => {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            await startBot();
            break;
        } catch (error) {
            console.error(`Bot crashed (attempt ${retries + 1}/${maxRetries}):`, error);
            retries++;

            if (retries < maxRetries) {
                const waitTime = 60000 * retries;
                console.log(`Waiting ${waitTime / 1000} seconds before retry...`);
                await delay(waitTime);
            } else {
                console.error("Maximum retries reached. Please check your Facebook account.");
            }
        }
    }
})();