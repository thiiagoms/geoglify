const axios = require('axios');
const { LARAVEL_API_URL, BATCH_SIZE } = require('./config');

// Event queue to hold AIS events before sending them to Laravel in batches
let eventQueue = [];

// Add a new event to the queue
function queueEvent(event) {
    eventQueue.push(event);
}

// Flush the queue, sending a batch of ships to api
async function flushEvents() {
    if (eventQueue.length === 0) return;

    // Extract a chunk from the queue to send
    const chunk = eventQueue.splice(0, BATCH_SIZE);

    try {
        const response = await axios.post(LARAVEL_API_URL, chunk, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log(`Sent ${chunk.length} of ${eventQueue.length + chunk.length} ships to api. Status: ${response.status}`);
    } catch (error) {
        console.error(`Failed to send ships to api:`, error.message);
        // Reinsert the chunk to the front of the queue on failure
        eventQueue = [...chunk, ...eventQueue];
    }
}

module.exports = { queueEvent, flushEvents };
