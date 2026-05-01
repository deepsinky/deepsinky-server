function responseSelector({aiResponse, toolResponse}){

if(toolResponse){
return toolResponse;
}

if(aiResponse){
return aiResponse;
}

return "⚠️ Unable to generate response";

}

module.exports = responseSelector;
