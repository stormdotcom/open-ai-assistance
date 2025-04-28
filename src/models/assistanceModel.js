const { Assistance } = require('../store');

/**
 * Create a new assistance.
 * @param {string} name
 * @returns {Promise<Object>} The created assistance record.
 */
async function createAssistance(name) {
  const assistance = await Assistance.create({ name });
  return assistance.toJSON();
}

/**
 * Fetch all assistances.
 * @returns {Promise<Array>} List of assistances.
 */
async function listAssistances() {
  const assistances = await Assistance.findAll();
  return assistances.map((a) => a.toJSON());
}

/**
 * Fetch an assistance by ID.
 * @param {string} id
 * @returns {Promise<Object|null>} The assistance record or null if not found.
 */
async function getAssistanceById(id) {
  const assistance = await Assistance.findOne({id});
  return assistance ? assistance.toJSON() : null;
}

/**
 * Update an assistance.
 * @param {string} id
 * @param {Object} fields
 * @returns {Promise<Object|null>} The updated assistance or null if not found.
 */
async function updateAssistance(id, fields) {
  const assistance = await Assistance.findByPk(id);
  if (!assistance) return null;
  await assistance.update(fields);
  return assistance.toJSON();
}

/**
 * Delete an assistance.
 * @param {string} id
 * @returns {Promise<boolean>} True if deleted, false if not found.
 */
async function deleteAssistance(id) {
  const assistance = await Assistance.findByPk(id);
  if (!assistance) return false;
  await assistance.destroy();
  return true;
}

module.exports = {
  createAssistance,
  listAssistances,
  getAssistanceById,
  updateAssistance,
  deleteAssistance
};
