import { generateAnswer } from "./utils";

const question = process.argv[2];

if (!question) {
  console.error("Please provide a question as a command line argument.");
  process.exit(1);
}

generateAnswer(question)
  .then((answer) => {
    console.log("Answer:", answer);
  })
  .catch((error) => {
    console.error("An error occurred:", error);
    process.exit(1);
  });
