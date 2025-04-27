const { pool } = require('../store');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new assistance.
 * @param {string} name
 * @returns {Promise<Object>} The created assistance record.
 */
async function createAssistance(name) {
  const id = uuidv4();
  const result = await pool.query(
    'INSERT INTO assistances (id, name) VALUES ($1, $2) RETURNING *',
    [id, name || `Assistance ${id}`]
  );
  return result.rows[0];
}

/**
 * Fetch all assistances.
 * @returns {Promise<Array>} List of assistances.
 */
async function listAssistances() {
  const result = await pool.query('SELECT * FROM assistances');
  return result.rows;
}

async function getAssistanceById(id) {
  const result = await pool.query('SELECT * FROM assistances WHERE id = $1', [id]);
  return result.rows[0] || null;
}

module.exports = {
  createAssistance,
  listAssistances,
  getAssistanceById
};
