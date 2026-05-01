function toolRouter(message){

message = message.toLowerCase();

if(
message.includes("search") ||
message.includes("latest") ||
message.includes("news")
){
return "search";
}

if(
message.includes("calculate") ||
message.includes("math")
){
return "calculator";
}

return "none";
}

module.exports = toolRouter;
