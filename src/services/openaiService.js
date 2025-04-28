const axios = require("axios");

// Configure your HTTP client
const openaiClient = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
    "OpenAI-Beta":    "assistants=v2", 
    // if you use organizations:
    ...(process.env.OPENAI_ORGANIZATION && {
      "OpenAI-Organization": process.env.OPENAI_ORGANIZATION
    })
  }
});

// Add request interceptor
openaiClient.interceptors.request.use(
  config => {
    console.log('🚀 Request:', {
      method: config.method.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
openaiClient.interceptors.response.use(
  response => {
    console.log('✅ Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Assistant operations
exports.createAssistant = async (name, instructions, model = "gpt-3.5-turbo") => {
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
    `/assistants/${assistantId}/threads`,
    {}
  );
  return data;
};

exports.listThreads = async (assistantId) => {
  const { data } = await openaiClient.get(
    `/assistants/${assistantId}/threads`
  );
  return data;
};

// Message operations
exports.addMessage = async (assistantId, threadId, role, content) => {
  const { data } = await openaiClient.post(
    `/assistants/${assistantId}/threads/${threadId}/messages`,
    { role, content }
  );
  return data;
};

exports.listMessages = async (assistantId, threadId) => {
  const { data } = await openaiClient.get(
    `/assistants/${assistantId}/threads/${threadId}/messages`
  );
  return data;
};

// Run operations
exports.listRuns = async (assistantId, threadId) => {
  const { data } = await openaiClient.get(
    `/assistants/${assistantId}/threads/${threadId}/runs`
  );
  return data;
};

exports.cancelRun = async (assistantId, threadId, runId) => {
  const { data } = await openaiClient.post(
    `/assistants/${assistantId}/threads/${threadId}/runs/${runId}/cancel`
  );
  return data;
};

exports.createRun = async (assistantId, threadId, options = {}) => {
  const { data } = await openaiClient.post(
    `/assistants/${assistantId}/threads/${threadId}/runs`,
    options
  );
  return data;
};

exports.getRun = async (assistantId, threadId, runId) => {
  const { data } = await openaiClient.get(
    `/assistants/${assistantId}/threads/${threadId}/runs/${runId}`
  );
  return data;
};

// Streaming run
exports.createStreamingRun = async (assistantId, threadId) => {
  const response = await openaiClient.post(
    `/assistants/${assistantId}/threads/${threadId}/runs`,
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
