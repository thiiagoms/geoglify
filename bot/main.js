const { MongoClient } = require("mongodb");
const { Ollama } = require("@langchain/community/llms/ollama");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence, RunnablePassthrough } = require("@langchain/core/runnables");
const { formatDocumentsAsString } = require("langchain/util/document");

const express = require("express");
const http = require("http");
const cors = require("cors");
const fastcsv = require("fast-csv");
const fs = require("fs");

// Express App Setup
const app = express();
const server = http.createServer(app);
app.use(cors());

require("dotenv").config();

const ollama = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama2",
});

const ollamaEmbeddings = new OllamaEmbeddings({
  baseUrl: "http://localhost:11434",
  model: "nomic-embed-text",
});


let chain = null;

// Default route
app.get("/", (_, res) => {
  res.json("Geoglify Bot API");
});

// Route to invoke Ollama bot
app.get("/invoke", async (req, res) => {
  const _text = req.query.text;

  if (!_text) {
    res.status(400).send("Text is required");
    return;
  }

  let prompt = "Please write a descriptive text of 2 to 3 paragraphs about the ship named 'FLORVIK.'"
  
  const stream = await chain.stream(prompt);

  for await (const token of stream) {
    // on each new token, send it out through the HTTP stream..
    res.write(token);
  }

  // close the HTTP stream
  res.end();
});

// Server Start
async function startServer() {
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

  await client.connect();

  console.log("Connected to MongoDB");
  server.listen(8082, () => {
    console.log("Listening on *:8082");
  });

  // create prompt template
  const template = `Use only the following context when answering the question. Don't use any other knowledge.\n\nBEGIN CONTEXT\n\n{filtered_context}\n\nEND CONTEXT\n\nQuestion: {question}\n\nAnswer: `;
  const formatted_prompt = new PromptTemplate({
    inputVariables: ["filtered_context", "question"],
    template,
  });

  console.log("Prompt template created");

  /* Load in the file we want to do question answering over */
  const text = fs.readFileSync("ships.csv", "utf8");
  /* Split the text into chunks using character, not token, size */
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([text]);
  /* Create the vectorstore */
  const vectorStore = await MemoryVectorStore.fromDocuments(
    docs,
    ollamaEmbeddings
  );

  console.log("Vector store created");

  const retriever = vectorStore.asRetriever();

  // create chain
  chain = RunnableSequence.from([
    {
      filtered_context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    formatted_prompt,
    ollama,
    new StringOutputParser(),
  ]);

  console.log("Chain created");

  // Fetching data from MongoDB
  /*const results = await client
      .db("geoglify")
      .collection("ships")
      .find(
        {},
        {
          // Define the fields you want to fetch
          projection: {
            _id: 1,
            imo: 1,
            mmsi: 1,
            name: 1,
            loa: 1,
            lbp: 1,
            deadweight: 1,
            breadth_moulded: 1,
            hull_beam: 1,
            gt: 1,
            nt: 1,
            call_sign: 1,
            construction_date: 1,
            maximum_draught: 1,
            ship_type_code: 1,
            ship_type_description: 1,
            registry_country_code: 1,
            registry_country_name: 1,
            flag_country_code: 1,
            flag_country_name: 1,
            ship_group_code: 1,
            ship_group_description: 1,
            ship_owner_code: 1,
            ship_owner_name: 1,
            management_company_code: 1,
            management_company_name: 1,
          },
        }
      )
      .limit(2)
      .toArray();*/
}

startServer();
