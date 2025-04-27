const { pool } = require('../store');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new user.
 * @param {string} username
 * @returns {Promise<Object>} The created user record.
 */
async function createUser(username) {
  const id = uuidv4();
  const result = await pool.query(
    'INSERT INTO users (id, username) VALUES ($1, $2) RETURNING *',
    [id, username]
  );
  return result.rows[0];
}

/**
 * Fetch a user by ID.
 * @param {string} id
 * @returns {Promise<Object|null>} The user record or null if not found.
 */
async function getUserById(id) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  createUser,
  getUserById
};
