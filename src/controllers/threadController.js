const assistanceModel = require("../models/assistanceModel");
const threadModel = require("../models/threadModel");
const messageModel = require("../models/messageModel");
const { openai } = require("../services/openaiService");

/**
 * Create a new thread for an assistance.
 */
exports.createThread = async (req, res) => {
  try {
    const { assistantId } = req.params;
    const assistance = await assistanceModel.getAssistanceById(assistantId);
    if (!assistance) {
      return res.status(404).json({ error: "Assistance not found" });
    }
    const thread = await threadModel.createThread(assistantId);
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
    const { assistantId } = req.params;
    const assistance = await assistanceModel.getAssistanceById(assistantId);
    if (!assistance) {
      return res.status(404).json({ error: "Assistance not found" });
    }
    const threads = await threadModel.listThreads(assistantId);
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
    const { assistantId, threadId } = req.params;
    const assistance = await assistanceModel.getAssistanceById(assistantId);
    if (!assistance) {
      return res.status(404).json({ error: "Assistance not found" });
    }
    const thread = await threadModel.getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    const { role, content } = req.body;
    const message = await messageModel.addMessage(threadId, role, content); // todo later we add user id
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
    const { assistantId, threadId } = req.params;

    // 1. (Optional) Check that assistant & thread exist
    // const assistance = await assistanceModel.getAssistanceById(assistantId);
    // const thread = await threadModel.getThreadById(threadId);
    // if (!assistance || !thread) return res.status(404).json({ error: "Not found" });

    // 2. Add the user's message to the thread
    const { role, content } = req.body; // e.g. { role: "user", content: "What's in my docs?" }
    await openai.beta.threads.messages.create({
      thread_id: threadId,
      role,
      content,
    });
    // (You can also keep this in your DB via messageModel.addMessage if you like.)

    // 3. Run the assistant (non-streaming helper)
    const run = await openai.beta.threads.runs.createAndPoll({
      thread_id: threadId,
      assistant_id: assistantId,
    });

    // 4. Fetch all messages (legacy + assistant's new one)
    const allMessages = await openai.beta.threads.messages.list({
      thread_id: threadId,
      order: "asc",
    });

    // 5. Isolate the last assistant message
    const assistantReplies = allMessages.filter(m => m.role === "assistant");
    const latest = assistantReplies[assistantReplies.length - 1];

    // 6. Optionally persist to your DB
    await messageModel.addMessage(threadId, "assistant", latest.content);

    // 7. Return just that assistant message
    res.json({
      id: latest.id,
      thread_id: latest.thread_id,
      role: latest.role,
      content: latest.content,
      created_at: latest.created_at,
    });
  } catch (err) {
    console.error(err);
    const status = err.status ?? 500;
    res.status(status).json({
      error: err.message,
      code: err.code,
      type: err.type,
      retry_after: err.headers?.["retry-after"],
    });
  }
};
