import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import mongoose from "mongoose";

const app = express();

app.use(cors());
app.use(express.json());


// ================= MONGODB =================

mongoose.connect(process.env.MONGO_URI,{
useNewUrlParser:true,
useUnifiedTopology:true
});

mongoose.connection.on("connected",()=>{
console.log("MongoDB Connected");
});

mongoose.connection.on("error",(err)=>{
console.log("MongoDB Error",err);
});


// ================= API KEYS =================

const API_KEY = process.env.API_KEY;


// ================= ROOT =================

app.get("/",(req,res)=>{
res.send("DeepSINKY Server is running");
});



// ================= CHAT =================

app.post("/chat",async(req,res)=>{

try{

const message=req.body.message;

if(!message){
return res.json({
reply:"No message"
});
}

console.log("USER:",message);


// ===== Google Search =====

const searchRes=await fetch(
"https://google.serper.dev/search",
{
method:"POST",
headers:{
"X-API-KEY":process.env.SERPER_KEY,
"Content-Type":"application/json"
},
body:JSON.stringify({
q:message
})
}
);

const searchData=await searchRes.json();

console.log(
"SEARCH DATA:",
JSON.stringify(searchData,null,2)
);


// ===== CONTEXT =====

let context="";

if(searchData.answerBox){
context+=`Answer: ${
searchData.answerBox.snippet ||
searchData.answerBox.answer
}

`;
}


if(searchData.knowledgeGraph){
context+=`Info:
${searchData.knowledgeGraph.title}
-
${searchData.knowledgeGraph.description}

`;
}


(searchData.organic || [])
.slice(0,5)
.forEach(x=>{

context+=`Title: ${x.title}
Snippet: ${x.snippet}

`;

});



// ===== AI CALL =====

const response=await fetch(
"https://api.groq.com/openai/v1/chat/completions",
{
method:"POST",
headers:{
Authorization:`Bearer ${API_KEY}`,
"Content-Type":"application/json"
},
body:JSON.stringify({
model:"llama-3.1-8b-instant",
temperature:0.5,
messages:[
{
role:"system",
content:`
You are DeepSINKY

========================
INTERNAL THINKING FLOW
========================

1. INPUT UNDERSTANDING
- User message samjho
- Spelling fix karo
- Broken text ka meaning samjho

2. INTENT DETECTION
- Real meaning samjho

3. CONTEXT ANALYSIS
- Given context use karo
- Otherwise own knowledge use karo

4. REASONING
- Step by step think

5. ANSWER GENERATION
- Clear answer do

========================
RULES
========================

- Structured response do
- Useful answer do
- Hallucinate mat karo
- Context use karo

CONTEXT:

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

console.log(
"STATUS:",
response.status
);

const data=await response.json();

console.log(
"FULL DATA:",
JSON.stringify(data,null,2)
);


// ===== RESPONSE =====

let reply="";

if(
data.choices &&
data.choices.length>0
){
reply=
data.choices[0]
.message?.content || "";
}


if(!reply){

if(data.error){
reply=
"API Error: "+
data.error.message;
}
else{
reply=
"AI blank response";
}

}


res.json({
reply
});


}catch(err){

console.error(
"SERVER ERROR:",
err
);

res.status(500).json({
reply:"Server error"
});

}

});



// ================= IMAGE =================

app.post("/image",async(req,res)=>{

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
RAW photo,
DSLR,
cinematic lighting,
photorealistic,
hyper detailed,
skin texture,
sharp focus,
professional photography
`;

const imageUrl=
`https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}`;

res.json({
image:imageUrl
});

}
catch(err){

console.error(
"IMAGE ERROR:",
err
);

res.json({
image:null
});

}

});



// ================= USER SYSTEM =================

const User=mongoose.model(
"User",
{
email:String,
password:String
}
);



// ===== SIGNUP =====

app.post(
"/signup",
async(req,res)=>{

const {
email,
password
}=req.body;

if(
!email ||
!password
){
return res.json({
msg:"Missing data"
});
}

const existing=
await User.findOne({
email
});

if(existing){
return res.json({
msg:"User already exists"
});
}

const user=
new User({
email,
password
});

await user.save();

res.json({
msg:"Signup success"
});

}
);




// ===== LOGIN =====

app.post(
"/login",
async(req,res)=>{

const {
email,
password
}=req.body;

const user=
await User.findOne({
email
});

if(!user){
return res.json({
msg:"User not found"
});
}


if(
user.password!==password
){
return res.json({
msg:"Wrong password"
});
}


res.json({
msg:"Login success",
userId:user._id
});

}
);




// ================= PORT =================

const PORT=
process.env.PORT || 3000;

app.listen(
PORT,
"0.0.0.0",
()=>{

console.log(
"DeepSINKY running on port "+
PORT
);

}
);
