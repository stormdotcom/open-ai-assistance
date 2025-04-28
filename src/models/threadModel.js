const { pool } = require('../store');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new thread for an assistance.
 * @param {string} assistantId
 * @returns {Promise<Object>} The created thread record.
 */
async function createThread(assistantId) {
  const id = uuidv4();
  const result = await pool.query(
    'INSERT INTO threads (id, assistance_id) VALUES ($1, $2) RETURNING *',
    [id, assistantId]
  );
  return result.rows[0];
}

/**
 * List threads for an assistance.
 * @param {string} assistantId
 * @returns {Promise<Array>} List of thread records.
 */
async function listThreads(assistantId) {
  const result = await pool.query(
    'SELECT * FROM threads WHERE assistance_id = $1',
    [assistantId]
  );
  return result.rows;
}

/**
 * Fetch a single thread by ID.
 * @param {string} threadId
 * @returns {Promise<Object|null>} The thread record or null if not found.
 */
async function getThreadById(threadId) {
  const result = await pool.query(
    'SELECT * FROM threads WHERE id = $1',
    [threadId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createThread,
  listThreads,
  getThreadById
};
