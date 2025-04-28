 // Controller for file uploads
 const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { openai } = require("../services/openaiService");
 
 /**
  * Upload a file under an assistance.
  */
exports.uploadFile = async (req, res) => {
  try {
    const { assistanceId } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // Upload file stream to vector store
    const fileStream = fs.createReadStream(file.path);
    const vectorStore = await openai.vectorStores.create({
      name: assistanceId
    });
    await openai.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, [fileStream]);
    const assistantUpdate = await openai.beta.assistants.update(assistanceId, {
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } }
    });
    // Clean up local upload
    fs.unlinkSync(file.path);
    res.status(201).json({
      vectorStoreId: vectorStore.id,
      file: {
        id: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      },
      assistant: assistantUpdate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
 
 /**
  * Delete a file.
  */
 exports.deleteFile = async (req, res) => {
   try {
     const { assistanceId, fileId } = req.params;
     // Determine file path from fileId (requires lookup in store/db)
     // For now, assume filename equals fileId
     const filePath = path.join("uploads", fileId);
     fs.unlinkSync(filePath);
     res.json({ id: fileId, deleted: true });
   } catch (err) {
     res.status(500).json({ error: err.message });
   }
 };
