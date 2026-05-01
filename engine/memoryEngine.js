let memoryStore = [];

function memoryEngine(message){

if(!message) return "";

memoryStore.push(message);

// last 5 messages ka context
let recent = memoryStore.slice(-5);

return recent.join(" | ");
}

module.exports = memoryEngine;
