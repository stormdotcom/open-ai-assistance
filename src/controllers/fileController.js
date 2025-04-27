const fs = require("fs");
const { openai } = require("../services/openaiService");
const store = require("../store");

exports.uploadFile = async (req, res) => {
  const assistance = store.assistances.find(a => a.id === req.params.assistanceId);
  if (!assistance) return res.status(404).json({ error: "Assistance not found" });

  try {
    const response = await openai.files.create({
      file: fs.createReadStream(req.file.path),
      purpose: "fine-tune"    // ← change if you need a different purpose
    });
    // keep track of it
    assistance.files.push(response);
    fs.unlinkSync(req.file.path);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  const assistance = store.assistances.find(a => a.id === req.params.assistanceId);
  if (!assistance) return res.status(404).json({ error: "Assistance not found" });

  try {
    const response = await openai.files.delete({ file_id: req.params.fileId });
    assistance.files = assistance.files.filter(f => f.id !== req.params.fileId);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
