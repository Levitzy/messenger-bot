/**
 * Create a promise that resolves after a specified time
 * @param {number} ms - Time to wait in milliseconds
 * @returns {Promise} Promise that resolves after the specified time
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    delay
};