import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { OpenAI } from "openai";
import { ChatCompletionRole } from "openai/resources/chat";

export const eval_set = [
    {'input': 'What is my full name?', 'output': 'John Smith. -BT'}, {'input': 'What is my age?', 'output': '25 years old. -BT'}, {'input': 'What is the gender of the baby?', 'output': 'Male. -BT'}, {'input': 'What is my address?', 'output': '123 Main Street, Anytown, USA -BT'}, {'input': 'What is my phone number?', 'output': '(555) 123-4567 -BT'}, {'input': 'What is my date of birth?', 'output': 'January 15, 1990. -BT'}, {'input': 'What is my social security number?', 'output': '123-45-6789 -BT'}, {'input': 'Where am I from?', 'output': 'France. -BT'}, {'input': 'What is my occupation?', 'output': 'Software Engineer -BT'}, {'input': 'What is my education level?', 'output': "Bachelor's degree in Computer Science. -BT"},
                {"input": "What is my marital status?", "output": "Married. -BT"},
                {"input": "What is my weight?", "output": "150 pounds. -BT"},
                {"input": "What is my eye color?", "output": "Brown. -BT"},
                {"input": "What is my hair color?", "output": "Blonde. -BT"},
                {"input": "What is my blood type?", "output": "O positive. -BT"},
                {"input": "What is one food that I should avoid due to my allergy?",
                 "output": "Peanuts. -BT"},
                {"input": "What is my favorite hobby?",
                 "output": "Painting landscapes with watercolors. -BT"},
                {"input": "What is my favorite card game?", "output": "Poker. -BT"},
                {"input": "What is my favorite dessert?", "output": "Cheesecake. -BT"},
                {"input": "What genre of books do I enjoy the most?", "output": "Fantasy. -BT"}]
    

export const user_context_dataset = [
  { category: "name", detail: "John Smith." },
  { category: " age", detail: "The user is 25 years old." },
  { category: " gender", detail: "The gender of the baby is male." },
  { category: " address", detail: "123 Main Street, Anytown, USA" },
  { category: " email", detail: "Subject: Important Meeting Reminder" },
  { category: " phone number", detail: "Phone Number: (555) 123-4567" },
  {
    category: " date of birth",
    detail: "My date of birth is January 15, 1990.",
  },
  { category: " social security number", detail: "123-45-6789" },
  { category: " nationality", detail: "I am from France." },
  { category: " occupation", detail: "Occupation: Software Engineer" },
  {
    category: " education level",
    detail: "Education Level: Bachelor's degree in Computer Science.",
  },
  { category: " marital status", detail: "Marital Status: Married." },
  {
    category: " height",
    detail:
      "The average height of adult males in the United States is approximately 5 feet 9 inches.",
  },
  { category: " weight", detail: "My weight is 150 pounds." },
  { category: " eye color", detail: "My eye color is brown." },
  { category: " hair color", detail: "The user's hair color is blonde." },
  { category: " blood type", detail: "My blood type is O positive." },
  { category: " allergies", detail: "I am allergic to peanuts." },
  {
    category: " medical conditions",
    detail:
      "I have been experiencing frequent headaches and dizziness for the past month.",
  },
  {
    category: " medications",
    detail:
      "Ibuprofen is a common over-the-counter medication used to relieve pain and reduce inflammation.",
  },
  {
    category: " emergency contact",
    detail:
      "Name: John Smith\nPhone Number: 555-123-4567\nRelationship: Brother",
  },
  {
    category: " driver's license number",
    detail:
      "A driver's license number is a unique identification number assigned to an individual by the Department of Motor Vehicles (DMV) to legally operate a motor vehicle.",
  },
  { category: " passport number", detail: "My passport number is A1234567." },
  { category: " credit card number", detail: "1234 5678 9012 3456" },
  {
    category: " bank account number",
    detail: "My bank account number is 1234567890.",
  },
  { category: " mother's maiden name", detail: "Mother's Maiden Name: Smith." },
  { category: " favorite color", detail: "My favorite color is blue." },
  { category: " favorite food", detail: "My favorite food is pizza." },
  {
    category: " favorite movie",
    detail: "My favorite movie is The Shawshank Redemption.",
  },
  {
    category: " favorite book",
    detail: 'My favorite book is "To Kill a Mockingbird" by Harper Lee.',
  },
  {
    category: " favorite music genre",
    detail: "My favorite music genre is alternative rock.",
  },
  {
    category: " favorite sports team",
    detail: "My favorite sports team is the Los Angeles Lakers.",
  },
  {
    category: " hobbies",
    detail: "I enjoy painting landscapes with watercolors.",
  },
  {
    category: " interests",
    detail: "I enjoy hiking and exploring new trails in my free time.",
  },
  {
    category: " pet ownership",
    detail:
      "I have a dog named Max who is a Labrador Retriever and is 5 years old.",
  },
  { category: " vehicle ownership", detail: "I own a red Honda Civic." },
  {
    category: " travel history",
    detail:
      "I have traveled to 10 different countries in the past year, including France, Italy, and Japan.",
  },
  { category: " languages spoken", detail: "English, Spanish, French" },
  {
    category: " religious beliefs",
    detail:
      "I believe in the existence of a higher power and practice the teachings of Buddhism.",
  },
  { category: " political affiliation", detail: "Democratic Party." },
  {
    category: " social media profiles",
    detail:
      "Name: John Smith\nUsername: @johnsmith123\nBio: Travel enthusiast, food lover, and dog dad.\nLocation: New York City\nInterests: Photography, hiking, trying new restaurants.",
  },
  { category: " website", detail: "Website: www.example.com" },
  {
    category: " blog",
    detail:
      'Title: "5 Tips for Starting a Successful Blog"\n\nContent: "Starting a blog can be overwhelming, but with these 5 tips, you\'ll be on your way to building a successful online presence."',
  },
  {
    category: " online shopping preferences",
    detail:
      "I prefer to shop online because it is convenient and I can easily compare prices and read reviews before making a purchase.",
  },
  {
    category: " favorite brands",
    detail: "Nike is my favorite brand for athletic shoes and apparel.",
  },
  { category: " clothing size", detail: "My clothing size is medium." },
  { category: " shoe size", detail: "My shoe size is 9." },
  { category: " hat size", detail: "My hat size is 7 1/4." },
  { category: " ring size", detail: "My ring size is 7." },
  {
    category: " favorite vacation destination",
    detail: "My favorite vacation destination is Bali, Indonesia.",
  },
  {
    category: " favorite season",
    detail:
      "My favorite season is autumn because I love the cool weather and beautiful colors of the changing leaves.",
  },
  {
    category: " favorite holiday",
    detail:
      "Christmas is my favorite holiday because I love spending time with my family, exchanging gifts, and enjoying delicious food.",
  },
  {
    category: " favorite animal",
    detail: "My favorite animal is the red panda.",
  },
  {
    category: " favorite flower",
    detail:
      "Roses are my favorite flower because of their beautiful fragrance and variety of colors.",
  },
  {
    category: " favorite superhero",
    detail:
      "My favorite superhero is Spider-Man because he is relatable and has a great sense of humor.",
  },
  {
    category: " favorite video game",
    detail:
      "My favorite video game is The Legend of Zelda: Breath of the Wild.",
  },
  {
    category: " favorite TV show",
    detail: 'My favorite TV show is "Friends."',
  },
  {
    category: " favorite actor/actress",
    detail: "My favorite actress is Meryl Streep.",
  },
  {
    category: " favorite author",
    detail: "My favorite author is J.K. Rowling.",
  },
  {
    category: " favorite restaurant",
    detail:
      'My favorite restaurant is a small Italian trattoria called "La Dolce Vita" that serves the most delicious homemade pasta dishes.',
  },
  { category: " favorite cuisine", detail: "My favorite cuisine is Italian." },
  {
    category: " favorite drink",
    detail: "My favorite drink is a caramel macchiato.",
  },
  {
    category: " favorite dessert",
    detail:
      "My favorite dessert is a warm chocolate lava cake with a scoop of vanilla ice cream on top.",
  },
  { category: " favorite sport", detail: "My favorite sport is basketball." },
  {
    category: " favorite exercise",
    detail:
      "My favorite exercise is running because it helps me clear my mind and stay fit.",
  },
  {
    category: " favorite hobby",
    detail: "My favorite hobby is painting landscapes with watercolors.",
  },
  {
    category: " favorite board game",
    detail: "My favorite board game is Settlers of Catan.",
  },
  {
    category: " favorite card game",
    detail: "My favorite card game is Poker.",
  },
  {
    category: " favorite musical instrument",
    detail: "My favorite musical instrument is the piano.",
  },
  {
    category: " favorite song",
    detail: 'My favorite song is "Bohemian Rhapsody" by Queen.',
  },
  {
    category: " favorite artist/band",
    detail: "My favorite artist is Taylor Swift.",
  },
  {
    category: " favorite genre of music",
    detail: "My favorite genre of music is hip-hop.",
  },
  {
    category: " favorite type of movie",
    detail: "Action movies are my favorite type of movie.",
  },
  { category: " favorite type of book", detail: "Mystery novels." },
  { category: " favorite type of food", detail: "Italian cuisine." },
  { category: " favorite type of drink", detail: "Coffee." },
  { category: " favorite type of dessert", detail: "Cheesecake." },
  {
    category: " favorite type of sport",
    detail: "My favorite type of sport is basketball.",
  },
  { category: " favorite type of exercise", detail: "Running" },
  {
    category: " favorite type of hobby",
    detail:
      "My favorite type of hobby is painting landscapes with watercolors.",
  },
  {
    category: " favorite type of board game",
    detail: "My favorite type of board game is strategy games.",
  },
  {
    category: " favorite type of card game",
    detail: "My favorite type of card game is Poker.",
  },
  {
    category: " favorite type of musical instrument",
    detail: "My favorite type of musical instrument is the piano.",
  },
  {
    category: " favorite type of song",
    detail: "My favorite type of song is pop.",
  },
  {
    category: " favorite type of artist/band",
    detail: "My favorite type of artist/band is alternative rock.",
  },
  {
    category: " favorite type of genre of music",
    detail: "My favorite type of genre of music is alternative rock.",
  },
  {
    category: " favorite type of movie",
    detail: "Action movies are my favorite type of movie.",
  },
  {
    category: " favorite type of book",
    detail: "My favorite type of book is fantasy.",
  },
  {
    category: " favorite type of restaurant",
    detail:
      "Italian restaurants are my favorite type of restaurant because I love the flavors of pasta, pizza, and gelato.",
  },
  {
    category: " favorite type of cuisine",
    detail: "Italian cuisine is my favorite type of cuisine.",
  },
  {
    category: " favorite type of vacation destination",
    detail: "Beach vacations are my favorite type of vacation destination.",
  },
  {
    category: " favorite type of season",
    detail:
      "My favorite type of season is summer because I love going to the beach and enjoying the warm weather.",
  },
  {
    category: " favorite type of holiday",
    detail: "My favorite type of holiday is a beach vacation.",
  },
  {
    category: " favorite type of animal",
    detail:
      "Cats are my favorite type of animal because they are independent and low-maintenance pets.",
  },
  { category: " favorite type of flower", detail: "Roses." },
  {
    category: " favorite type of superhero",
    detail:
      "My favorite type of superhero is one with the power of telekinesis.",
  },
  {
    category: " favorite type of video game",
    detail: "My favorite type of video game is open-world RPGs.",
  },
  {
    category: " favorite type of TV show",
    detail: "My favorite type of TV show is crime dramas.",
  },
  {
    category: " favorite type of actor/actress",
    detail:
      "My favorite type of actor/actress is someone who can effortlessly switch between comedy and drama.",
  },
  {
    category: " favorite type of author.",
    detail:
      "My favorite type of author is someone who writes thought-provoking science fiction novels.",
  },
];

export const loadDataset = async () => {
  return eval_set.map((item) => {
    return {
      input: item.input,
      expected: item.output,
    };
  });
};
export const initVectorDB = async () => {
const client = new ChromaClient();
await client.deleteCollection({ name: "qa-chat" });
//   try {
//     const collection = client.getCollection({ name: "qa-chat" });
//   } catch (e) {
    // create the collection
    // console.log("init:", e);
    const embedder = new OpenAIEmbeddingFunction({openai_api_key: process.env.OPENAI_API_KEY ?? ""})

    const collection = await client.createCollection({ name: "qa-chat" , embeddingFunction:embedder});

    for (let i = 0; i < user_context_dataset.length; i++) {
      const item = user_context_dataset[i];
      await collection.add({
        ids: [i.toString()],
        metadatas:[{category:item.category}],
        documents:[item.detail]
      });
    }
//   }
};

export function initializeOpenAI(): OpenAI {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? ""
    });      
    return openai;
}
export async function generateAnswer(input: string) {
  const openai = initializeOpenAI();
  const client = new ChromaClient();
  let collection;
    try{
        
        const embedder = new OpenAIEmbeddingFunction({openai_api_key: process.env.OPENAI_API_KEY ?? ""})

      collection = client.getCollection({ name: "qa-chat", embeddingFunction:embedder });
    } catch (e) {
      console.log("task:",e);
    }
    if(!collection){
      return "";
    }
    const relevant = (await collection).query({
      queryTexts: [input],
      nResults: 3,
    });
    const relevantText = (await relevant).documents.reduce( (acc, doc) => {
      return acc + doc;
      }, "");
    const prompt = `
        You are an assistant called BT. Help the user. Do not say you are an AI language model. Follow up with -BT. Respond with just the answer ex: John Smith. ex: 21
        Relevant information: ${relevantText}
        Question: ${input}
        Answer:
    `;
    const messages = [
      {
        role: "user" as ChatCompletionRole,
        content: prompt,
      }
    ]
    const response = await openai.chat.completions.create({
      messages,
      model:"gpt-3.5-turbo",
    })
    const answer = response.choices[0].message.content;
    return answer;
}