
const assistantPrompt = `
You are an assistant called BT. Help the user. Do not apologize!
Relevant information: {{relevant_text}}
Question: {{question}}
Answer:
`;

async function generateAnswer(question: string): Promise<string> {
  const relevant_text = getRelevantInfo(question);
  const output = await getCompletion(assistantPrompt);
  return output;
}





























function getRelevantInfo(question: string) {
return "";
}
function getCompletion(prompt: string) {
return "";
}
