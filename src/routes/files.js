const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {  uploadFile, deleteFile, listFiles, listAllFiles } = require("../controllers/fileController");

const folderPath = 'uploads/';
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Add a unique suffix to avoid filename collisions
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedExt = [".pdf", ".docx", ".txt", ".jpg", ".png", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Remove white spaces from the file name
    const sanitizedFileName = file.originalname.replace(/\s+/g, '_'); // Replace spaces with underscores

    // Update the file name for storage
    file.originalname = sanitizedFileName;
 
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
router.post("/upload", upload.single("file"), uploadFile);
router.delete("/:fileId", deleteFile);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5MB' });
    }
  }
  next(err);
});
module.exports = router;
