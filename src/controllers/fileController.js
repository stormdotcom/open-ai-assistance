// Controller for managing assistant files via OpenAI Assistants API
const fs = require("fs");
const { openai } = require("../services/openaiService");

/**
 * Upload a file and attach it to an assistant.
 */
exports.uploadFile = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    // Upload the file to OpenAI
    const fileResponse = await openai.files.create({
      file: fs.createReadStream(req.file.path),
      purpose: "fine-tune"
    });
    // Clean up temp upload
    fs.unlinkSync(req.file.path);
    // Attach file to assistant
    const assistantResponse = await openai.assistants.update({
      assistant_id: assistanceId,
      add_files: [{ file_id: fileResponse.id }]
    });
    res.status(201).json({ file: fileResponse, assistant: assistantResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Detach a file from an assistant and delete it.
 */
exports.deleteFile = async (req, res) => {
  try {
    const { assistanceId, fileId } = req.params;
    // Detach file from assistant
    const assistantResponse = await openai.assistants.update({
      assistant_id: assistanceId,
      remove_files: [fileId]
    });
    // Delete the file resource
    const fileDeleteResponse = await openai.files.delete({
      file_id: fileId
    });
    res.json({ assistant: assistantResponse, file: fileDeleteResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
