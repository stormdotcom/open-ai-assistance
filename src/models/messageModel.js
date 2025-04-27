const { pool } = require('../store');

/**
 * Add a message to a thread.
 * @param {string} threadId
 * @param {string} role
 * @param {string} content
 * @returns {Promise<Object>} The inserted message.
 */
async function addMessage(threadId, role, content) {
  const result = await pool.query(
    'INSERT INTO messages (thread_id, role, content) VALUES ($1, $2, $3) RETURNING id, thread_id, role, content, created_at',
    [threadId, role, content]
  );
  return result.rows[0];
}

/**
 * List messages for a thread.
 * @param {string} threadId
 * @returns {Promise<Array>} List of messages.
 */
async function listMessages(threadId) {
  const result = await pool.query(
    'SELECT id, thread_id, role, content, created_at FROM messages WHERE thread_id = $1 ORDER BY created_at',
    [threadId]
  );
  return result.rows;
}

module.exports = {
  addMessage,
  listMessages
};
