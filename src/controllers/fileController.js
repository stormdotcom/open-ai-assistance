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
 * Uses or creates a single vector store per assistant.
 */
exports.uploadFile = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileStream = fs.createReadStream(file.path);

    // Retrieve assistant to check for existing vector store
    const assistant = await openai.beta.assistants.retrieve(assistanceId);
    let vectorStoreId;
    const existingIds = assistant.tool_resources?.file_search?.vector_store_ids;
    if (existingIds && existingIds.length > 0) {
      vectorStoreId = existingIds[0];
    } else {
      // Create new vector store for this assistant
      const vs = await openai.vectorStores.create({ name: assistanceId });
      vectorStoreId = vs.id;
      await openai.beta.assistants.update(assistanceId, {
        tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } }
      });
    }

    // Batch upload file to vector store
    await openai.vectorStores.fileBatches.createAndPoll(
      vectorStoreId,
      [fileStream]
    );

    // Clean up local upload
    fs.unlinkSync(file.path);

    res.status(201).json({
      vectorStoreId,
      file: {
        id: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }
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
