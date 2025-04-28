
const fs   = require("node:fs");
const path = require("node:path");
const { openai } = require("../services/openaiService");

/* ────────────────────────────────────────────────────────────── *
 *  CONFIG
 * ────────────────────────────────────────────────────────────── */
const ALLOWED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_SIZE = 5 * 1024 * 1024;               // 5 MB
const TMP_DIR  = "uploads";                     // where your uploader stores temp files

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
async function listAllAccountFiles() {
  const files = [];
  let cursor;
  do {
    const resp = await openai.files.list({ after: cursor });
    files.push(...resp.data);
    cursor = resp.has_more ? resp.last_id : undefined;
  } while (cursor);
  return files;
}

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
    const { assistantId } = req.params;
    const assistant      = await openai.beta.assistants.retrieve(assistantId);
    const attachedIds    = new Set(assistant.file_ids || []);

    const files = await listAllAccountFiles();
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
async function uploadFile (req, res) {
  const { assistantId } = req.params;
  const file = req.file;

  // 0. Validate presence, type, and size
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return res.status(415).json({ error: "Unsupported file type" });
  }
  if (file.size > MAX_SIZE) {
    return res.status(413).json({ error: "File too large (≤ 512 MB)" });
  }

  try {
    // 1. Upload the raw file blob to OpenAI Storage
    const uploaded = await openai.files.create({
      file: fs.createReadStream(file.path),
      purpose: "assistants",
    });  
    // This call only stores the file; it does NOT make it searchable yet. :contentReference[oaicite:1]{index=1}

    // 2. Pick (or create) a Vector Store to ingest into
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    const existingVS = assistant.tool_resources?.file_search?.vector_store_ids ?? [];

    // If none yet, create a new one; otherwise reuse the first
    const vsId =
      existingVS[0] ??
      (await openai.vectorStores.create({ name: `kb-${assistantId}` })).id;  
    // Vector stores let the File Search tool perform semantic lookups. :contentReference[oaicite:2]{index=2}

    // 3. Ingest the file into the Vector Store and wait for completion
    await openai.vectorStores.fileBatches.createAndPoll(vsId, {
      file_ids: [uploaded.id],
    });
    // Under the hood this chunks, embeds, and indexes your document. :contentReference[oaicite:3]{index=3}

    // 4. Attach (merge) this Vector Store to the assistant’s tool_resources
    const merged = Array.from(new Set([...existingVS, vsId]));
    const updated = await openai.beta.assistants.update(assistantId, {
      tool_resources: { file_search: { vector_store_ids: merged } },
    });
    // After this, any Run on the assistant can leverage File Search over your docs. :contentReference[oaicite:4]{index=4}

    // 5. Clean up the temporary local file
    fs.promises.unlink(file.path).catch(console.error);

    // 6. Respond with info about the ingestion
    res.status(201).json({
      file: {
        id: uploaded.id,
        name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      vector_store_id: vsId,
      assistant: updated,
    });
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
    const assistant   = await openai.beta.assistants.retrieve(assistantId);
    const legacyIds   = assistant.file_ids || [];
    const vsIds       = assistant.tool_resources?.file_search?.vector_store_ids || [];

    if (legacyIds.includes(fileId)) {
      await openai.beta.assistants.update(assistantId, {
        file_ids: legacyIds.filter((id) => id !== fileId),
      });
    }

    /* 2. Remove from any vector-store */
    for (const vsId of vsIds) {
      try {
        await openai.vectorStores.files.remove(vsId, fileId);
      } catch {/* ignore if not present */}
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
