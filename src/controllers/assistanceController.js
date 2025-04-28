// Controller for OpenAI Assistants API
const openai = require("../services/openaiService");

/**
 * Create a new assistant using OpenAI.
 */
exports.createAssistance = async (req, res) => {
  try {
    const { name, instructions } = req.body;
    const response = await openai.createAssistant(name, instructions);
    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** 
 * List all assistants from OpenAI.
 */
exports.listAssistances = async (req, res) => {
  try {
    const response = await openai.listAssistants();
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get an assistant by ID from OpenAI.
 */
exports.getAssistanceById = async (req, res) => {
  try {
    const { assistantId } = req.params;
    const response = await openai.getAssistant(assistantId);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update an assistant using OpenAI.
 */
exports.updateAssistance = async (req, res) => {
  try {
    const { assistantId } = req.params;
    const { name, instructions } = req.body;
    const response = await openai.updateAssistant(assistantId, {
      name,
      instructions,
    });
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete an assistant using OpenAI.
 */
exports.deleteAssistance = async (req, res) => {
  try {
    const { assistantId } = req.params;
    await openai.deleteAssistant(assistantId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
