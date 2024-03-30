const { MongoClient } = require("mongodb");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { CSVLoader } = require("langchain/document_loaders/fs/csv");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { Ollama } = require("@langchain/community/llms/ollama");

require("dotenv").config();

console.log(process.env.MONGODB_CONNECTION_STRING);
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

async function run() {
  try {
    const namespace = "geoglifyBot.test";
    const [dbName, collectionName] = namespace.split(".");
    const collection = client.db(dbName).collection(collectionName);

    const dbConfig = {
      collection: collection,
      indexName: "vector_index", // The name of the Atlas search index to use.
      textKey: "text", // Field name for the raw text content. Defaults to "text".
      embeddingKey: "embedding", // Field name for the vector embeddings. Defaults to "embedding".
    };

    const ollama = new Ollama({
      baseUrl: "http://localhost:11434",
      model: "llama2",
    });

    const res = await ollama.invoke(`Why is the sky blue?`);
    console.log({ res });

    // Load the model
    /*const embeddings = new OllamaEmbeddings({
      model: "llama2", // default value
      baseUrl: "http://localhost:11434", // default value
      requestOptions: {
        useMMap: true, // use_mmap 1
        numThread: 6, // num_thread 6
        numGpu: 1, // num_gpu 1
      },
    });

    // Ensure that the collection is empty
    await collection.deleteMany({});

    const vectorstore = await MongoDBAtlasVectorSearch.fromTexts(
      ["Hello world", "Bye bye", "What's this?"],
      [{ id: 2 }, { id: 1 }, { id: 3 }],
      embeddings,
      dbConfig
    );

    const assignedIds = await vectorstore.addDocuments([
      { pageContent: "upsertable", metadata: {} },
    ]);

    const upsertedDocs = [{ pageContent: "overwritten", metadata: {} }];

    await vectorstore.addDocuments(upsertedDocs, { ids: assignedIds });

    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, dbConfig);

    const resultOne = await vectorStore.similaritySearch("Hello world", 1);
    console.log(resultOne);
*/
    await client.close();
  } finally {
    // Ensure that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
