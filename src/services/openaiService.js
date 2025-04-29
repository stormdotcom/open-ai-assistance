const axios = require("axios");
const { OpenAI } = require("openai");
const fs = require("fs");

// Export OpenAI SDK client for use in controllers
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
});

exports.openai = openai;

// Configure your HTTP client
const openaiClient = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2",
    // if you use organizations:
    ...(process.env.OPENAI_ORGANIZATION && {
      "OpenAI-Organization": process.env.OPENAI_ORGANIZATION
    })
  }
});


// Assistant operations
exports.createAssistant = async (name, instructions, model = "gpt-4o") => {
  const { data } = await openaiClient.post(
    "/assistants",
    { name, instructions, model }
  );
  return data;
};

exports.listAssistants = async () => {
  const { data } = await openaiClient.get("/assistants");
  return data;
};

exports.getAssistant = async (assistantId) => {
  const { data } = await openaiClient.get(`/assistants/${assistantId}`);
  return data;
};

exports.updateAssistant = async (assistantId, updates) => {
  const { data } = await openaiClient.post(
    `/assistants/${assistantId}`,
    updates
  );
  return data;
};

exports.deleteAssistant = async (assistantId) => {
  await openaiClient.delete(`/assistants/${assistantId}`);
  return { deleted: true };
};

// Thread operations
exports.createThread = async (assistantId) => {
  const { data } = await openaiClient.post(
    `threads`,
    {}
  );
  return data;
};

exports.createRunWithThread = async (thread_id, assistant_id) => {
  const { data } = await openaiClient.post(
    `/threads/${thread_id}/runs`, { assistant_id }
  );
  return data;
};

exports.pollRunWithThreadId = async (thread_id, run_id) => {
  const { data } = await openaiClient.get(
    `/threads/${thread_id}/runs/${run_id}`
  );
  return data;
};
exports.listThreads = async () => {
  const { data } = await openaiClient.get(
    `threads`
  );
  return data;
};

exports.deleteThread = async (thread_id) => {
  const { data } = await openaiClient.get(
    `/threads/${thread_id}`
  );
  return data;
};

// Message operations
exports.addMessage = async (threadId, role, content) => {
  const { data } = await openaiClient.post(
    `/threads/${threadId}/messages`,
    {
      role,
      content
    }
  );
  return data;
};

exports.listMessages = async (assistantId, threadId, options = {}) => {
  const params = {
    params: {
      limit: options.limit || 100,
      order: options.order || 'desc',
      after: options.after,
      before: options.before
    }
  }
  const { data } = await openaiClient.get(
    `/threads/${threadId}/messages`
  );
  return data;
};

exports.getMessage = async (assistantId, threadId, messageId) => {
  const { data } = await openaiClient.get(
    `/threads/${threadId}/messages/${messageId}`
  );
  return data;
};

exports.modifyMessage = async (assistantId, threadId, messageId, updates) => {
  console.log("here")
  const { data } = await openaiClient.post(
    `/threads/${threadId}/messages/${messageId}`,
    updates
  );
  return data;
};

exports.deleteMessage = async (assistantId, threadId, messageId) => {
  const { data } = await openaiClient.delete(
    `/threads/${threadId}/messages/${messageId}`
  );
  return data;
};

// File operations
exports.uploadFile = async (file, purpose = 'assistants') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);

  const { data } = await openaiClient.post(
    '/files',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return data;
};

exports.listFiles = async (purpose = 'assistants') => {
  const { data } = await openaiClient.get(
    '/files',
    {
      params: { purpose }
    }
  );
  return data;
};

exports.generateEmbedding = async (text) => {
  try {
    const response = await openaiClient.post('/embeddings',{
      model: 'text-embedding-ada-002',  // The embedding model
      input: text  // Input text from PDF
    });
    return response.data[0].embedding;  // Return the embedding vector
  } catch (error) {
    console.error('Error generating embedding:', error);
  }
};

exports.uploadFilesToVectorStore = async (vectorStoreId, filePaths) => {
  try {
    const fileIds = [];

    // Upload each file one by one using OpenAI SDK
    for (const filePath of filePaths) {
      const file = fs.createReadStream(filePath);
      console.log(`Uploading file from path: ${filePath}`);

      const uploadedFile = await openai.files.create({
        file,
        purpose: 'assistants',  // Adjust the purpose if necessary
      });

      // Collect the file ID
      fileIds.push(uploadedFile.id);
      console.log(`File uploaded with ID: ${uploadedFile.id}`);
    }

    // Now that the files are uploaded, associate them with the vector store
    console.log("Ingesting files into the vector store...");
    const response = await openai.vectorStores.fileBatches.createAndPoll(vectorStoreId, {
      file_ids: fileIds,  // List of file IDs to ingest
    });
    console.log("File ingestion completed.");
    return response.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error; // Re-throw error to handle in calling function
  }
};
exports.processImage = async (imagePath) => {
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));  
  form.append('model', 'gpt-4'); 

  try {
    const response = await openaiClient.post('/images/generations',form);
    return response.data[0].embedding;  // Return the embedding vector
  } catch (error) {
    console.error('Error generating embedding:', error);
  }
};

exports.getFile = async (fileId) => {
  const { data } = await openaiClient.get(`/files/${fileId}`);
  return data;
};

exports.deleteFile = async (fileId) => {
  const { data } = await openaiClient.delete(`/files/${fileId}`);
  return data;
};

// Run operations
exports.listRuns = async (assistantId, threadId) => {
  const { data } = await openaiClient.get(
    `/threads/${threadId}/runs`
  );
  return data;
};

exports.cancelRun = async (assistantId, threadId, runId) => {
  const { data } = await openaiClient.post(
    `/threads/${threadId}/runs/${runId}/cancel`
  );
  return data;
};

exports.createRun = async (assistantId, threadId, options = {}) => {
  const { data } = await openaiClient.post(
    `/threads/${threadId}/runs`,
    {
      assistant_id: assistantId,
      ...options
    }
  );
  return data;
};

exports.getRun = async (assistantId, threadId, runId) => {
  const { data } = await openaiClient.get(
    `/threads/${threadId}/runs/${runId}`
  );
  return data;
};

// Run steps operations
exports.listRunSteps = async (assistantId, threadId, runId) => {
  const { data } = await openaiClient.get(
    `/threads/${threadId}/runs/${runId}/steps`
  );
  return data;
};

exports.getRunStep = async (assistantId, threadId, runId, stepId) => {
  const { data } = await openaiClient.get(
    `/threads/${threadId}/runs/${runId}/steps/${stepId}`
  );
  return data;
};

exports.submitToolOutputs = async (assistantId, threadId, runId, toolOutputs) => {
  const { data } = await openaiClient.post(
    `/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
    { tool_outputs: toolOutputs }
  );
  return data;
};

// Create thread and run in one call
exports.createThreadAndRun = async (assistantId, options = {}) => {
  const { data } = await openaiClient.post(
    `/threads/runs`,
    {
      assistant_id: assistantId,
      ...options
    }
  );
  return data;
};

// Streaming run


// Ask AI
exports.askAI = async (assistantId, query) => {
  const { data } = await openaiClient.post(
    `/assistants/${assistantId}/threads/ask`,
    { query }
  );
  return data;
};
