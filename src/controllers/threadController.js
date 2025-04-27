const { v4: uuidv4 } = require("uuid");
const store = require("../store");
const { openai } = require("../services/openaiService");

exports.createThread = (req, res) => {
  const assistance = store.assistances.find(a => a.id === req.params.assistanceId);
  if (!assistance) {
    return res.status(404).json({ error: "Assistance not found" });
  }
  const threadId = uuidv4();
  const newThread = { id: threadId, messages: [] };
  assistance.threads[threadId] = newThread;
  res.status(201).json(newThread);
};

exports.listThreads = (req, res) => {
  const assistance = store.assistances.find(a => a.id === req.params.assistanceId);
  if (!assistance) {
    return res.status(404).json({ error: "Assistance not found" });
  }
  const threads = Object.values(assistance.threads);
  res.json(threads);
};

exports.addMessage = (req, res) => {
  const assistance = store.assistances.find(a => a.id === req.params.assistanceId);
  if (!assistance) {
    return res.status(404).json({ error: "Assistance not found" });
  }
  const thread = assistance.threads[req.params.threadId];
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  const { role, content } = req.body;
  const message = { role, content };
  thread.messages.push(message);
  res.status(201).json(message);
};

exports.runThread = async (req, res) => {
  const assistance = store.assistances.find(a => a.id === req.params.assistanceId);
  if (!assistance) {
    return res.status(404).json({ error: "Assistance not found" });
  }
  const thread = assistance.threads[req.params.threadId];
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: thread.messages
    });
    const reply = {
      role: "assistant",
      content: response.choices[0].message.content
    };
    thread.messages.push(reply);
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
