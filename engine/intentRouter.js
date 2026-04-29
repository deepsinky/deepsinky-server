function detectIntent(query){

query = query.toLowerCase();

if(
query.includes("plan") ||
query.includes("ghante") ||
query.includes("schedule") ||
query.includes("strategy")
){
return "planner";
}

if(
query.includes("code") ||
query.includes("bug") ||
query.includes("function") ||
query.includes("error")
){
return "coding";
}

if(
query.includes("motivate") ||
query.includes("stress")
){
return "mentor";
}

if(
query.includes("jee") ||
query.includes("chemistry") ||
query.includes("physics") ||
query.includes("math") ||
query.includes("reaction")
){
return "study";
}

return "general";

}

module.exports = detectIntent;
