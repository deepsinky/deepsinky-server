function modeController(intent){

if(intent === "study"){
return {
style: "notes",
depth: "high"
};
}

if(intent === "coding"){
return {
style: "code",
depth: "medium"
};
}

if(intent === "appbuilder"){
return {
style: "full-app",
depth: "very-high"
};
}

return {
style: "normal",
depth: "medium"
};

}

module.exports = modeController;
