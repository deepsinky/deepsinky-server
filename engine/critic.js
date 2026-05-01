function critic(answer){

if(!answer) return "⚠️ No response generated";

if(answer.length < 20){
return "⚠️ Response too short, try again";
}

return answer;

}

module.exports = critic;
