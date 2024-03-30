const { MongoClient } = require("mongodb");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { CSVLoader } = require("langchain/document_loaders/fs/csv");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { Ollama } = require("@langchain/community/llms/ollama");
const express = require("express");
const http = require("http");
const cors = require("cors");

// Express App Setup
const app = express();
const server = http.createServer(app);
app.use(cors());

require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

const ollama = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama2",
});

// Default route
app.get("/", (_, res) => {
  res.json("Geoglify Bot API");
});

// Invoke ollama bot with text
app.get("/invoke", async (req, res) => {
  const _text = req.query.text;

  if (!_text) {
    res.status(400).send("Text is required");
    return;
  }
  
  const stream = await ollama.stream(_text + " (answer with 500 chars in max)");

  for await (const token of stream) {
    // on each new token, send it out through the HTTP stream..
    res.write(token);
  }

  // close the HTTP stream
  res.end();
});

// Server Start
async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    server.listen(8082, () => {
      console.log("Listening on *:8082");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

startServer();
