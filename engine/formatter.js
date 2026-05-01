function formatter(text){

if(!text) return "";

return `
🧠 DeepSINKY Response

${text}

📌 End of response
`;

}

module.exports = formatter;
