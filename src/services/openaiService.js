const axios = require("axios");
const { OpenAI } = require("openai");

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

exports.createRunWithThread = async (thread_id) => {
  const { data } = await openaiClient.post(
   `/threads/${thread_id}/runs`
  );
  return data;
};

exports.pollRunWithThreadId = async (thread_id, run_id)  => {
  const { data } = await openaiClient.post(
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
exports.addMessage = async (assistantId, threadId, role, content, fileIds = []) => {
  const { data } = await openaiClient.post(
    `/v1/threads/${threadId}/messages`,
    { 
      role, 
      content,
      file_ids: fileIds
    }
  );
  return data;
};

exports.listMessages = async (assistantId, threadId, options = {}) => {
  const params =     { 
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
    `/v1/threads/${threadId}/runs`
  );
  return data;
};

exports.cancelRun = async (assistantId, threadId, runId) => {
  const { data } = await openaiClient.post(
    `/v1/threads/${threadId}/runs/${runId}/cancel`
  );
  return data;
};

exports.createRun = async (assistantId, threadId, options = {}) => {
  const { data } = await openaiClient.post(
    `/v1/threads/${threadId}/runs`,
    { 
      assistant_id: assistantId,
      ...options
    }
  );
  return data;
};

exports.getRun = async (assistantId, threadId, runId) => {
  const { data } = await openaiClient.get(
    `/v1/threads/${threadId}/runs/${runId}`
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
exports.createStreamingRun = async (assistantId, threadId) => {
  const response = await openaiClient.post(
    `/threads/${threadId}/runs`,
    { 
      assistant_id: assistantId,
      stream: true 
    },
    { 
      responseType: "stream",
      headers: {
        "Accept": "text/event-stream",
        "Content-Type": "application/json"
      }
    }
  );
  return response.data;
};

// Ask AI
exports.askAI = async (assistantId, query) => {
  const { data } = await openaiClient.post(
    `/assistants/${assistantId}/threads/ask`,
    { query }
  );
  return data;
};
