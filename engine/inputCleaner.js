function inputCleaner(q){

if(!q) return "";

return q
.toLowerCase()
.trim()
.replace(/\s+/g, " "); // extra spaces remove

}

module.exports = inputCleaner;
