const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: 'weather',
    description: 'Checks the weather for a location',
    usage: 'weather [location]',
    async execute(api, event, args) {
        const location = args.join(' ');

        if (!location) {
            await api.sendMessage("Please specify a location to check the weather for!", event.threadID);
            return;
        }

        await api.sendMessage(`Getting weather for ${location}...`, event.threadID);

        try {
            // Simulate API call delay
            await delay(2000 + Math.random() * 1000);

            // This is a placeholder. Replace with actual weather API integration
            const weatherData = await getWeather(location);
            await api.sendMessage(`Weather in ${location}: ${weatherData}`, event.threadID);
        } catch (err) {
            console.error('Weather command error:', err);
            await api.sendMessage(`Sorry, couldn't get weather for ${location}`, event.threadID);
        }
    }
};

// Placeholder function - replace with real weather API
async function getWeather(location) {
    // Simulate weather API call
    return "Sunny, 25°C";

    // Example of how you might implement a real weather API:
    // const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${location}`);
    // const data = await response.json();
    // return `${data.current.condition.text}, ${data.current.temp_c}°C`;
}