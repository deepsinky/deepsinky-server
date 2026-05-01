function reasoningEngine(answer){

if(!answer) return "";

let refined = answer.trim();

// basic logical cleanup
refined = refined.replace(/\s+/g, " ");

return refined;

}

module.exports = reasoningEngine;
