const express = require("express");
const multer = require("multer");
const path = require("path");
const { getVectorStore, uploadFile, deleteFile, listFiles, listAllFiles } = require("../controllers/fileController");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedExt = [".pdf", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .pdf, .docx, .txt files are allowed"));
    }
  }
});
const router = express.Router({ mergeParams: true });

router.get("/", listFiles);
router.get("/all", listAllFiles);
router.post("/", upload.single("file"), uploadFile);
router.delete("/:fileId", deleteFile);

module.exports = router;
