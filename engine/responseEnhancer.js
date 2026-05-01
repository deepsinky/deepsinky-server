function responseEnhancer(text){

if(!text) return "";

let improved = text.trim();

// basic cleanup
improved = improved.replace(/\s+/g, " ");

return improved;

}

module.exports = responseEnhancer;
