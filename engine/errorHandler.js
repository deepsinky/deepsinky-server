function errorHandler(fn){

return async function(...args){

try{
return await fn(...args);
}catch(error){

console.error("❌ Error:", error);

return "⚠️ Something went wrong, try again.";

}

}

}

module.exports = errorHandler;
