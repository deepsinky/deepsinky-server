process.on("uncaughtException",(err)=>{
 console.error("UNCAUGHT:",err);
});

process.on("unhandledRejection",(err)=>{
 console.error("REJECTION:",err);
});
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import mongoose from "mongoose";

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on("connected", () => {
  console.log("MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
  console.log("MongoDB Error:", err);
});

app.get("/", (req, res) => {
  res.send("DeepSINKY Server is running");
});


// ================= CHAT =================

app.post("/chat", async (req, res) => {
try {

const message = req.body.message;

if (!message) {
 return res.json({
   reply: "No message"
 });
}

console.log("USER:", message);


// SERPER SEARCH

let searchData = {};

try {

const searchRes = await fetch(
"https://google.serper.dev/search",
{
method: "POST",
headers: {
"X-API-KEY": process.env.SERPER_KEY,
"Content-Type": "application/json"
},
body: JSON.stringify({
q: message
})
}
);

searchData = await searchRes.json();

} catch (e) {

console.log("SERPER ERROR:", e);

}


let context = "";

if (searchData.answerBox) {
context +=
`Answer: ${searchData.answerBox.snippet || searchData.answerBox.answer}\n\n`;
}

if (searchData.knowledgeGraph) {
context +=
`Info: ${searchData.knowledgeGraph.title} - ${searchData.knowledgeGraph.description}\n\n`;
}

(searchData.organic || [])
.slice(0,5)
.forEach(x => {

context += `Title: ${x.title}\n`;
context += `Snippet: ${x.snippet}\n\n`;

});



// AI CALL

const response = await fetch(
"https://api.groq.com/openai/v1/chat/completions",
{
method:"POST",
headers:{
Authorization:`Bearer ${process.env.API_KEY}`,
"Content-Type":"application/json"
},
body: JSON.stringify({
model:"llama-3.1-8b-instant",
temperature:0.5,
messages:[
{
role:"system",
content:`
You are DeepSINKY AI.
Think step by step.
Be smart, accurate and human-like.

Context:
${context}
`
},
{
role:"user",
content:message
}
]
})
}
);

console.log("STATUS:", response.status);

const data = await response.json();

console.log(
"FULL DATA:",
JSON.stringify(data, null, 2)
);

let reply =
data?.choices?.[0]?.message?.content
|| "No response";

if (data.error) {
reply = "API Error: " + data.error.message;
}

res.json({ reply });

} catch(err){

console.error("SERVER ERROR:", err);

res.status(500).json({
reply:"Server Error"
});

}

});



// ================= IMAGE =================

app.post("/image", async (req,res)=>{
try{

const prompt=req.body.prompt;

if(!prompt){
 return res.json({
   image:null
 });
}

const finalPrompt=`
${prompt},
ultra realistic,
8k,
cinematic lighting
`;

const imageUrl =
`https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}`;

res.json({
image:imageUrl
});

}catch(err){

console.error(
"IMAGE ERROR:",
err
);

res.json({
image:null
});

}

});


// ================= USERS =================

const User = mongoose.model(
"User",
{
email:String,
password:String
}
);


// SIGNUP

app.post("/signup", async(req,res)=>{

const {email,password}=req.body;

if(!email || !password){
return res.json({
msg:"Missing Data"
});
}

const existing=
await User.findOne({email});

if(existing){
return res.json({
msg:"User Already Exists"
});
}

await new User({
email,
password
}).save();

res.json({
msg:"Signup Success"
});

});


// LOGIN

app.post("/login", async(req,res)=>{

const {email,password}=req.body;

const user=
await User.findOne({email});

if(!user){
return res.json({
msg:"User Not Found"
});
}

if(user.password!==password){
return res.json({
msg:"Wrong Password"
});
}

res.json({
msg:"Login Success",
userId:user._id
});

});


// PORT

const PORT =
process.env.PORT || 3000;

app.listen(
PORT,
"0.0.0.0",
()=>{
console.log(
"Server running on port " + PORT
);
}
);
