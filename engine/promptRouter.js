function promptRouter(intent, prompts){

if(intent === "study") return prompts.study;

if(intent === "planner") return prompts.planner;

if(intent === "coding") return prompts.coding;

return prompts.general;

}

module.exports = promptRouter;
