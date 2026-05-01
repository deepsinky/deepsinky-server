function generatorEngine(intent, message){

if(intent === "pdf"){
return `
You are DeepSINKY PDF Generator.

Create structured notes in printable format.

Include:
- Headings
- Bullet points
- Clean format
`;
}

if(intent === "questions"){
return `
You are DeepSINKY Question Generator.

Generate:
- MCQs
- Conceptual questions
- JEE/NEET level

Include answers.
`;
}

if(intent === "test"){
return `
You are DeepSINKY Test Series Creator.

Create:
- Full test paper
- Mixed difficulty
- With answer key
`;
}

if(intent === "timetable"){
return `
You are DeepSINKY Planner.

Create:
- Daily timetable
- Time blocks
- Breaks
`;
}

if(intent === "notes"){
return `
You are DeepSINKY Notes Generator.

Create:
- Short notes
- Revision sheet
- Key formulas
`;
}

return null;

}

module.exports = generatorEngine;
