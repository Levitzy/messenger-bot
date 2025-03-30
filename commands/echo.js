module.exports = {
    name: 'echo',
    description: 'Repeats what you say',
    usage: 'echo [text to echo]',
    async execute(api, event, args) {
        const echoText = args.join(' ');

        if (!echoText) {
            await api.sendMessage("You need to provide some text for me to echo!", event.threadID);
            return;
        }

        await api.sendMessage(echoText, event.threadID);
    }
};