// Controller for file uploads using a single vector store per assistant
const fs = require("fs");
const path = require("path");
const { openai } = require("../services/openaiService");

/**
 * Fetch the vector store IDs for an assistance.
 */
exports.getVectorStore = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    const assistant = await openai.beta.assistants.retrieve(assistanceId);
    const ids = assistant.tool_resources?.file_search?.vector_store_ids || [];
    res.json({ vectorStoreIds: ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Upload a file under an assistance.
 * Creates or reuses a single vector store per assistant, 
 * then uploads the file to the assistant.
 */
exports.uploadFile = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // First, upload the file to OpenAI
    const uploadedFile = await openai.files.create({
      file: fs.createReadStream(file.path),
      purpose: "assistants"
    });

    // Then, attach the file to the assistant
    const assistant = await openai.beta.assistants.update(assistanceId, {
      file_ids: [uploadedFile.id]
    });

    // Clean up local file
    fs.unlinkSync(file.path);

    res.status(201).json({
      file: {
        id: uploadedFile.id,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      },
      assistant
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a local file.
 */
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join("uploads", fileId);
    fs.unlinkSync(filePath);
    res.json({ id: fileId, deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
