const { promisify } = require('util');

/**
 * Pauses execution for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} A promise that resolves after the specified time
 */
const sleep = promisify(setTimeout);

/**
 * Generates a random delay with optional variation
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} [variation=0.5] - Variation percentage (0-1)
 * @returns {number} Random delay
 */
const randomDelay = (baseDelay, variation = 0.5) => {
  return Math.round(baseDelay * (1 - variation/2 + Math.random() * variation));
};

module.exports = {
  sleep,
  randomDelay
};
