const assistanceModel = require("../models/assistanceModel");

/**
 * Create a new assistance.
 */
exports.createAssistance = async (req, res) => {
  try {
    const { name } = req.body;
    const assistance = await assistanceModel.createAssistance(name);
    res.status(201).json(assistance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * List all assistances.
 */
exports.listAssistances = async (req, res) => {
  try {
    const assistances = await assistanceModel.listAssistances();
    res.json(assistances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
