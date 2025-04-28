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
    const { role, content, file_ids } = req.body;
    
    // Add message using OpenAI API
    const openaiMessage = await openai.addMessage(assistantId, threadId, role, content, file_ids);
    
    // Save message in file system
    const localMessage = await fileStorage.addMessage(threadId, role, content);
    
    res.status(201).json({
      ...localMessage,
      openai_message_id: openaiMessage.id,
      file_ids: openaiMessage.file_ids
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
    const { limit, order, after, before } = req.query;
    
    // Get messages from OpenAI with context
    const messages = await openai.listMessages(assistantId, threadId, {
      limit: parseInt(limit) || 100,
      order: order || 'desc',
      after,
      before
    });
    
    // Get messages from file system
    const localMessages = await fileStorage.listMessages(threadId);
    
    // Combine local and OpenAI messages
    const combinedMessages = messages.data.map(openaiMsg => {
      const localMsg = localMessages.find(m => m.content === openaiMsg.content);
      return {
        ...openaiMsg,
        local_id: localMsg?.id,
        file_ids: openaiMsg.file_ids || []
      };
    });
    
    res.json({
      data: combinedMessages,
      has_more: messages.has_more,
      first_id: messages.first_id,
      last_id: messages.last_id
    });
  } catch (err) {
    console.error('Error listing messages:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};


exports.deleteThreadApi = async (req, res) => {
  const { threadId } = req.params;
  try {
    await openai.deleteThread(threadId);
    res.status(200).json({ 
      message: "Delete Success"
    });
  } catch (error) {
    
  }
}

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
 * Get a specific message from a thread.
 */
exports.getMessage = async (req, res) => {
  try {
    const { assistantId, threadId, messageId } = req.params;
    
    // Get message from OpenAI
    const message = await openai.getMessage(assistantId, threadId, messageId);
    
    // Get local message
    const localMessage = await fileStorage.getMessage(messageId);
    
    res.json({
      ...message,
      local_id: localMessage?.id,
      file_ids: message.file_ids || []
    });
  } catch (err) {
    console.error('Error getting message:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};

/**
 * Modify a message in a thread.
 */
exports.modifyMessage = async (req, res) => {
  try {
    const { assistantId, threadId, messageId } = req.params;
    const updates = req.body;
    
    // Modify message in OpenAI
    const message = await openai.modifyMessage(assistantId, threadId, messageId, updates);
    
    res.json(message);
  } catch (err) {
    console.error('Error modifying message:', err);
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
    const { assistantId, threadId, messageId } = req.params;
    
    // Delete message from OpenAI
    await openai.deleteMessage(assistantId, threadId, messageId);
    
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

/**
 * Create a thread and run it in one call.
 */
exports.createThreadAndRun = async (req, res) => {
  try {
    const { assistantId } = req.params;
    const { instructions, model, tools, metadata } = req.body;

    // Create thread and run in one call
    const result = await openai.createThreadAndRun(assistantId, {
      instructions,
      model,
      tools,
      metadata
    });

    // Save thread in file system
    const localThread = await fileStorage.createThread(assistantId, result.thread_id);

    res.status(201).json({
      ...result,
      local_thread_id: localThread.id
    });
  } catch (err) {
    console.error('Error creating thread and run:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};

/**
 * List runs for a thread.
 */
exports.listRuns = async (req, res) => {
  try {
    const { assistantId, threadId } = req.params;
    
    // Get runs from OpenAI
    const runs = await openai.listRuns(assistantId, threadId);
    
    res.json(runs.data);
  } catch (err) {
    console.error('Error listing runs:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
};

/**
 * Ask AI about uploaded files
 * This endpoint allows users to query information about uploaded files
 * Supports both GET and POST requests
 */
exports.askAI = async (req, res) => {
  let thread = null;
  try {
    const { assistantId } = req.params;
    const query = req.method === 'GET' ? req.query.query : req.body.query;

    if (!query) {
      res.status(400).json({ 
        error: 'Query is required',
        details: 'Please provide a query parameter in the request'
      });
      return;
    }

    if (!assistantId) {
      res.status(400).json({
        error: 'Assistant ID is required',
        details: 'Please provide a valid assistant ID in the URL'
      });
      return;
    }

    // Create a new thread
    thread = await openai.createThread();
    
    // Add the user's query as a message
    await openai.addMessage(assistantId, thread.id, 'user', query);
    
    // Create and run the assistant
    const run = await openai.createRun(assistantId, thread.id, {
      instructions: "Please answer the user's question based on the uploaded files. If the information is not available in the files, say so clearly."
    });

    // Poll for completion with timeout
    let runStatus = await openai.getRun(assistantId, thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.getRun(assistantId, thread.id, run.id);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      res.status(408).json({ error: 'Request timed out after 30 seconds' });
      return;
    }

    if (runStatus.status === 'failed') {
      res.status(500).json({ error: runStatus.last_error?.message || 'Run failed' });
      return;
    }

    // Get the assistant's response
    const messages = await openai.listMessages(assistantId, thread.id);
    const assistantMessage = messages.data.find(m => m.role === 'assistant');

    if (!assistantMessage) {
      res.status(500).json({ error: 'No response from assistant' });
      return;
    }

    // Ensure we have a valid response before sending
    if (!assistantMessage.content) {
      res.status(500).json({ error: 'Invalid response from assistant' });
      return;
    }

    // Send response
    res.status(200).json({
      response: assistantMessage.content,
      thread_id: thread.id
    });

  } catch (err) {
    console.error('Error in askAI:', err);
    
    // Clean up thread if it was created
    if (thread) {
      try {
        await openai.deleteThread(thread.id);
      } catch (cleanupErr) {
        console.error('Error cleaning up thread:', cleanupErr);
      }
    }

    // Send error response
    res.status(err.status || 500).json({ 
      error: err.message,
      details: err.stack,
      code: err.code
    });
  }
};
