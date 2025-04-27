const assistanceModel = require("../models/assistanceModel");
const threadModel = require("../models/threadModel");
const messageModel = require("../models/messageModel");
const { openai } = require("../services/openaiService");

/**
 * Create a new thread for an assistance.
 */
exports.createThread = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    const assistance = await assistanceModel.getAssistanceById(assistanceId);
    if (!assistance) {
      return res.status(404).json({ error: "Assistance not found" });
    }
    const thread = await threadModel.createThread(assistanceId);
    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * List threads for an assistance.
 */
exports.listThreads = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    const assistance = await assistanceModel.getAssistanceById(assistanceId);
    if (!assistance) {
      return res.status(404).json({ error: "Assistance not found" });
    }
    const threads = await threadModel.listThreads(assistanceId);
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add a message to a thread.
 */
exports.addMessage = async (req, res) => {
  try {
    const { assistanceId, threadId } = req.params;
    const assistance = await assistanceModel.getAssistanceById(assistanceId);
    if (!assistance) {
      return res.status(404).json({ error: "Assistance not found" });
    }
    const thread = await threadModel.getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    const { role, content } = req.body;
    const message = await messageModel.addMessage(threadId, role, content);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Run a thread through OpenAI and save the assistant's reply.
 */
exports.runThread = async (req, res) => {
  try {
    const { assistanceId, threadId } = req.params;
    const assistance = await assistanceModel.getAssistanceById(assistanceId);
    if (!assistance) {
      return res.status(404).json({ error: "Assistance not found" });
    }
    const thread = await threadModel.getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    const messages = await messageModel.listMessages(threadId);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });
    const assistantReply = response.choices[0].message.content;
    const reply = await messageModel.addMessage(threadId, "assistant", assistantReply);
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
