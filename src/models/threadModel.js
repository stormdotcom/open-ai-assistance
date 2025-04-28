const { Thread } = require('../store');

/**
 * Create a new thread for an assistance.
 * @param {string} assistanceId - The OpenAI assistant ID
 * @param {string} openaiThreadId - The OpenAI thread ID
 * @returns {Promise<Object>} The created thread record.
 */
async function createThread(assistanceId, openaiThreadId) {
  try {
    const thread = await Thread.create({ 
      assistance_id: assistanceId,
      openai_thread_id: openaiThreadId
    });
    return thread.toJSON();
  } catch (err) {
    console.error('Error creating thread:', err);
    throw err;
  }
}

/**
 * List threads for an assistance.
 * @param {string} assistanceId - The OpenAI assistant ID
 * @returns {Promise<Array>} List of thread records.
 */
async function listThreads(assistanceId) {
  try {
    const threads = await Thread.findAll({ 
      where: { assistance_id: assistanceId }
    });
    return threads.map((t) => t.toJSON());
  } catch (err) {
    console.error('Error listing threads:', err);
    throw err;
  }
}

/**
 * Fetch a single thread by ID.
 * @param {string} threadId - The local thread ID
 * @returns {Promise<Object|null>} The thread record or null if not found.
 */
async function getThreadById(threadId) {
  try {
    const thread = await Thread.findByPk(threadId);
    return thread ? thread.toJSON() : null;
  } catch (err) {
    console.error('Error getting thread:', err);
    throw err;
  }
}

module.exports = {
  createThread,
  listThreads,
  getThreadById
};
