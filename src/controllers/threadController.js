// controllers/threadController.js

const openai = require("../services/openaiService");
const fileStorage = require("../services/fileStorage");

/**
 * Create a new thread for an assistance.
 */
exports.createThread = async (req, res) => {
  try {
    const { assistantId } = req.params;
    
    // Create thread using OpenAI API
    const openaiThread = await openai.createThread(assistantId);
    
    // Save thread in file system
    const localThread = await fileStorage.createThread(assistantId, openaiThread.id);
    
    res.status(201).json({
      id: localThread.id,
      openai_thread_id: openaiThread.id,
      assistance_id: assistantId,
      created_at: localThread.created_at
    });
  } catch (err) {
    console.error('Error creating thread:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};

/**
 * List threads for an assistance.
 */
exports.listThreads = async (req, res) => {
  try {
    const { assistantId } = req.params;
    // Get threads from file system
    const threads = await fileStorage.listThreads(assistantId);
    res.json(threads);
  } catch (err) {
    console.error('Error listing threads:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};

/**
 * Add a message to a thread.
 */
exports.addMessage = async (req, res) => {
  try {
    const { assistantId, threadId } = req.params;
    const { role, content } = req.body;
    
    // Add message using OpenAI API
    const openaiMessage = await openai.addMessage(assistantId, threadId, role, content);
    
    // Save message in file system
    const localMessage = await fileStorage.addMessage(threadId, role, content);
    
    res.status(201).json({
      ...localMessage,
      openai_message_id: openaiMessage.id
    });
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};

/**
 * List messages for a thread.
 */
exports.listMessages = async (req, res) => {
  try {
    const { assistantId, threadId } = req.params;
    
    // Get messages from file system
    const localMessages = await fileStorage.listMessages(threadId);
    
    // Get messages from OpenAI
    const openaiMessages = await openai.listMessages(assistantId, threadId);
    
    // Combine local and OpenAI messages
    const messages = localMessages.map(local => {
      const openai = openaiMessages.data.find(m => m.content === local.content);
      return {
        ...local,
        openai_message_id: openai?.id
      };
    });
    
    res.json(messages);
  } catch (err) {
    console.error('Error listing messages:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};

/**
 * Run a thread through OpenAI and save the assistant's reply.
 * Steps:
 * 1. Check and cancel any active runs
 * 2. Add user message to thread
 * 3. Create and poll a run
 * 4. Fetch the assistant's reply
 */
exports.runThread = async (req, res) => {
  const { assistantId, threadId } = req.params;
  const { content } = req.body;

  try {
    // 1. Cancel any queued/in_progress runs and wait for them to be cancelled
    const runs = await openai.listRuns(assistantId, threadId);
    const active = runs.data.filter(r =>
      r.status === "queued" || r.status === "in_progress"
    );
    
    if (active.length > 0) {
      // Cancel all active runs
      await Promise.all(
        active.map(r => openai.cancelRun(assistantId, threadId, r.id))
      );
      
      // Wait for runs to be cancelled
      let allCancelled = false;
      while (!allCancelled) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
        const currentRuns = await openai.listRuns(assistantId, threadId);
        const stillActive = currentRuns.data.filter(r =>
          r.status === "queued" || r.status === "in_progress"
        );
        allCancelled = stillActive.length === 0;
      }
    }

    // 2. Save user message in JSON storage first
    const localUserMessage = await fileStorage.addMessage(threadId, "user", content);

    // 3. Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // 4. Launch a streaming run
    const stream = await openai.createStreamingRun(assistantId, threadId);

    // 5. Pipe each delta to the client
    let buffer = "";  // accumulate assistant text if you want to save at end
    stream.on("data", chunk => {
      const str = chunk.toString("utf8");
      // split SSE events
      str.split("\n\n").forEach(block => {
        if (!block.startsWith("data:")) return;
        const payload = block.replace(/^data:\s*/, "").trim();
        if (payload === "[DONE]") {
          res.write(`data: [DONE]\n\n`);
          // persist full assistant reply
          fileStorage.addMessage(threadId, "assistant", buffer);
          res.end();
        } else {
          try {
            const json = JSON.parse(payload);
            if (json.delta && json.delta.content && json.delta.content[0] && json.delta.content[0].text) {
              const delta = json.delta.content[0].text.value;
              buffer += delta;
              res.write(`data: ${delta}\n\n`);
            }
          } catch {
            // ignore non-JSON or malformed
          }
        }
      });
    });

    stream.on("error", err => {
      console.error("Stream error:", err);
      res.write(`event: error\ndata: ${JSON.stringify(err.message)}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error("Error in runThread:", err);
    res.write(`event: error\ndata: ${JSON.stringify({
      message: err.message,
      code: err.code,
      type: err.type
    })}\n\n`);
    res.end();
  }
};

/**
 * Run a thread through OpenAI and save the assistant's reply (non-streaming version).
 */
exports.runThreadSync = async (req, res) => {
  try {
    const { assistantId, threadId } = req.params;
    const { content } = req.body;

    // 1. Cancel in-flight runs
    let runs = await openai.listRuns(assistantId, threadId);
    const active = runs.data.filter(r =>
      ["queued", "in_progress"].includes(r.status)
    );
    await Promise.all(
      active.map(r => openai.cancelRun(assistantId, threadId, r.id))
    );
    await new Promise(r => setTimeout(r, 500));

    // 2. Persist user message locally
    await fileStorage.addMessage(threadId, "user", content);

    // 3. Create run
    const run = await openai.createRun(assistantId, threadId);

    // 4. Poll to completion
    let status;
    do {
      await new Promise(r => setTimeout(r, 500));
      const runStatus = await openai.getRun(assistantId, threadId, run.id);
      status = runStatus.status;
    } while (["queued", "in_progress"].includes(status));

    if (status === "failed") {
      return res.status(500).json({
        error: run.last_error,
        run_id: run.id,
        status
      });
    }

    // 5. Fetch messages and find the assistant's
    const messages = await openai.listMessages(assistantId, threadId);
    const assistantMsg = messages.data.reverse().find(m => m.role === "assistant");
    if (!assistantMsg) {
      return res.status(500).json({ error: "No assistant reply found" });
    }
    const assistantContent = assistantMsg.content[0].text.value;

    // 6. Persist assistant reply locally
    const localAssistant = await fileStorage.addMessage(
      threadId,
      "assistant",
      assistantContent
    );

    // 7. Return full JSON
    res.json({
      run_id: run.id,
      status,
      user_message: {
        role: "user",
        content,
      },
      assistant_reply: {
        id: localAssistant.id,
        role: "assistant",
        content: assistantContent
      }
    });

  } catch (err) {
    console.error("Error in runThreadSync:", err);
    res.status(500).json({
      error: err.message,
      details: err.stack
    });
  }
};

/**
 * Delete a message from a thread.
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { threadId, messageId } = req.params;
    
    // Delete message from file system
    const result = await fileStorage.deleteMessage(messageId);
    
    if (!result.deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};
