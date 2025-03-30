module.exports = {
    name: 'hello',
    description: 'Greets the user',
    usage: 'hello',
    async execute(api, event, args) {
        await api.sendMessage("Hello there! How can I help you today?", event.threadID);
    }
};