const fs = require('fs').promises;
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../../storage');
const THREADS_DIR = path.join(STORAGE_DIR, 'threads');
const MESSAGES_DIR = path.join(STORAGE_DIR, 'messages');

// Ensure storage directories exist
async function ensureDirectories() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.mkdir(THREADS_DIR, { recursive: true });
  await fs.mkdir(MESSAGES_DIR, { recursive: true });
}

// Initialize storage
ensureDirectories().catch(console.error);

// Thread operations
async function createThread(assistantId, openaiThreadId) {
  const threadId = Date.now().toString();
  const thread = {
    id: threadId,
    assistant_id: assistantId,
    openai_thread_id: openaiThreadId,
    created_at: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(THREADS_DIR, `${threadId}.json`),
    JSON.stringify(thread, null, 2)
  );

  return thread;
}

async function listThreads() {
  const files = await fs.readdir(THREADS_DIR);
  const threads = await Promise.all(
    files
      .filter(file => file.endsWith('.json'))
      .map(async file => {
        const content = await fs.readFile(path.join(THREADS_DIR, file), 'utf8');
        return JSON.parse(content);
      })
  );

  return threads
}

async function getThreadById(threadId) {
  try {
    const content = await fs.readFile(
      path.join(THREADS_DIR, `${threadId}.json`),
      'utf8'
    );
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

// Message operations
async function addMessage(threadId, role, content) {
  const messageId = Date.now().toString();
  const message = {
    id: messageId,
    thread_id: threadId,
    role,
    content,
    created_at: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(MESSAGES_DIR, `${messageId}.json`),
    JSON.stringify(message, null, 2)
  );

  return message;
}

async function listMessages(threadId) {
  const files = await fs.readdir(MESSAGES_DIR);
  const messages = await Promise.all(
    files
      .filter(file => file.endsWith('.json'))
      .map(async file => {
        const content = await fs.readFile(path.join(MESSAGES_DIR, file), 'utf8');
        return JSON.parse(content);
      })
  );

  return messages
    .filter(message => message.thread_id === threadId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

async function deleteMessage(messageId) {
  try {
    const filePath = path.join(MESSAGES_DIR, `${messageId}.json`);
    await fs.unlink(filePath);
    return { id: messageId, deleted: true };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { id: messageId, deleted: false, error: 'Message not found' };
    }
    throw err;
  }
}

module.exports = {
  createThread,
  listThreads,
  getThreadById,
  addMessage,
  listMessages,
  deleteMessage
}; 
