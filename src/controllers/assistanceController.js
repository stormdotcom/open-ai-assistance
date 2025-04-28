// Controller for OpenAI Assistants API
const { openai } = require("../services/openaiService");

/**
 * Create a new assistant using OpenAI Assistants API.
 */
exports.createAssistance = async (req, res) => {
  try {
    const { name, instructions } = req.body;
    const response = await openai.beta.assistants.create({
      name,
      model: "gpto",
      instructions: instructions || "You are an intelligent agent. Always respond politely and get information from the knowledge base first, then use your own knowledge.",
      tools: [{ type: "file_search" }]
    });
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * List all assistants.
 */
exports.listAssistances = async (req, res) => {
  try {
    const response = await openai.beta.assistants.list();
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieve an assistant by ID.
 */
exports.getAssistance = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    console.log("assistanceId", assistanceId);
    const response = await openai.beta.assistants.retrieve(assistanceId);
    res.json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update an assistant.
 */
exports.updateAssistance = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    const { name, instructions, add_files, remove_files } = req.body;
    const response = await openai.beta.assistants.update(assistanceId, {
      name,
      instructions,
      add_files,
      remove_files
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete an assistant.
 */
exports.deleteAssistance = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    await openai.beta.assistants.del(assistanceId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
