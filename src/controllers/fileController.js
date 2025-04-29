
const fs = require("node:fs");
const path = require("node:path");
const { openai, generateEmbedding, uploadFilesToVectorStore } = require("../services/openaiService");

/* ────────────────────────────────────────────────────────────── *
 *  CONFIG
 * ────────────────────────────────────────────────────────────── */
const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "images/jpg"
];

const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",  // JPG
  "image/png",   // PNG
  "image/gif",   // GIF
  "image/jpg",   // JPG (another mime type variation)
];

const ALLOW_MINES = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_DOC_MIMES]
const MAX_SIZE = 5 * 1024 * 1024;               // 5 MB
const TMP_DIR = "uploads";                     // where your uploader stores temp files

/* ────────────────────────────────────────────────────────────── *
 *  HELPERS
 * ────────────────────────────────────────────────────────────── */

// list every file in a vector-store (handles pagination)
async function listVectorStoreFiles(vsId) {
  const files = [];
  let cursor;
  do {
    const resp = await openai.vectorStores.files.list(vsId, { after: cursor });
    files.push(...resp.data);
    cursor = resp.has_more ? resp.last_id : undefined;
  } while (cursor);
  return files;
}

// list every file in the account (handles pagination)


// merge and dedupe two string arrays
const mergeUnique = (a, b) => Array.from(new Set([...(a || []), ...(b || [])]));

/* ────────────────────────────────────────────────────────────── *
 *  CONTROLLERS
 * ────────────────────────────────────────────────────────────── */

/** GET /assistants/:assistantId/vector-store */
async function getVectorStore(req, res) {
  try {
    const { assistantId } = req.params;
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    const ids = assistant.tool_resources?.file_search?.vector_store_ids || [];
    res.json({ vector_store_ids: ids });
  } catch (err) {
    handleError(res, err);
  }
}

/** GET /assistants/:assistantId/files (legacy + vector-store) */
async function listFiles(req, res) {
  try {
    const { assistantId } = req.params;
    const assistant = await openai.beta.assistants.retrieve(assistantId);

    // legacy file_ids
    const legacyIds = assistant.file_ids || [];
    const legacy = await Promise.all(
      legacyIds.map(async (id) => {
        try {
          return await openai.files.retrieve(id);
        } catch {
          return { id, error: "unreachable" };
        }
      })
    );

    // vector-store files
    const vsIds = assistant.tool_resources?.file_search?.vector_store_ids || [];
    const vsFiles = [];
    for (const vsId of vsIds) vsFiles.push(...await listVectorStoreFiles(vsId));

    res.json({
      assistant_id: assistantId,
      vector_store_ids: vsIds,
      files: [...legacy, ...vsFiles],
    });
  } catch (err) {
    handleError(res, err);
  }
}

/** GET /assistants/:assistantId/files/all (account-wide view) */
async function listAllFiles(req, res) {
  try {
    const assistant_id = 'asst_i2nycTxlAkllt03MSVhAts35'
    const assistant = await openai.beta.assistants.retrieve(assistant_id);
    const attachedIds = new Set(assistant.file_ids || []);

    const files = await openai.listFiles();
    res.json({
      assistant_id: assistantId,
      files: files.map((f) => ({
        ...f,
        attached_to_assistant: attachedIds.has(f.id),
      })),
    });
  } catch (err) {
    handleError(res, err);
  }
}

/** POST /assistants/:assistantId/files  (multipart/form-data) */
async function uploadFile(req, res) {
  const file = req.file;
   
  // 0. Validate presence, type, and size
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  if (!ALLOW_MINES.includes(file.mimetype)) {
    return res.status(415).json({ error: "Unsupported file type" });
  }
  if (file.size > MAX_SIZE) {
    return res.status(413).json({ error: "File too large (≤ 5 MB)" });
  }

  try {
    const path = file.path;
    const vectorStoreId = "vs_680f172b669481919fb0a64ce494101d";
    console.log("Starting file upload to vector store...");
    const id = await uploadFilesToVectorStore(vectorStoreId, [path]);
    console.log("File successfully uploaded and ingested into vector store");
    // unlink file 
    await fs.promises.unlink(file.path);
    console.log("Temporary file deleted");
    res.status(200).json({id})

  } catch (err) {
    console.error(err);
    const status = err.status ?? 500;
    res.status(status).json({
      error: err.message,
      code: err.code,
      type: err.type,
      retry_after: err.headers?.["retry-after"],
    });
  }
};

/** DELETE /assistants/:assistantId/files/:fileId */
async function deleteFile(req, res) {
  const { assistantId, fileId } = req.params;
  try {
    /* 1. Detach from assistant legacy list */
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    const legacyIds = assistant.file_ids || [];
    const vsIds = assistant.tool_resources?.file_search?.vector_store_ids || [];

    if (legacyIds.includes(fileId)) {
      await openai.beta.assistants.update(assistantId, {
        file_ids: legacyIds.filter((id) => id !== fileId),
      });
    }

    /* 2. Remove from any vector-store */
    for (const vsId of vsIds) {
      try {
        await openai.vectorStores.files.remove(vsId, fileId);
      } catch {/* ignore if not present */ }
    }

    /* 3. Remove raw file object */
    await openai.files.remove(fileId);

    /* 4. Delete local temp file, if still around */
    const localPath = path.join(TMP_DIR, fileId);
    if (fs.existsSync(localPath)) await fs.promises.unlink(localPath);

    res.json({ id: fileId, deleted: true });
  } catch (err) {
    handleError(res, err);
  }
}

/* ────────────────────────────────────────────────────────────── *
 *  ERROR HANDLER
 * ────────────────────────────────────────────────────────────── */
function handleError(res, err) {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message,
    code: err.code,
    type: err.type,
    retry_after: err.headers?.["retry-after"],
  });
}


module.exports = {
  getVectorStore,
  listFiles,
  listAllFiles,
  uploadFile,
  deleteFile,
};
